import axios, { AxiosInstance } from 'axios';

import { trace } from '@opentelemetry/api';
import z from 'zod';
import { config, log } from '../config';
import { Spotify } from './Spotify';
import { addSpanAttributes, addSpanError, TraceMethod } from './telemetry';

export type YoutubeSearchResult = z.infer<typeof YoutubeSearchResult>;
export const YoutubeSearchResult = z.object({
  kind: z.literal('youtube#searchResult'),
  id: z.object({
    kind: z.literal('youtube#video'),
    videoId: z.string(),
  }),
  snippet: z.object({
    title: z.string(),
    channelTitle: z.string(),
  }),
});

export type YoutubeSearchListResult = z.infer<typeof YoutubeSearchListResult>;
const YoutubeSearchListResult = z.object({
  kind: z.literal('youtube#searchListResponse'),
  items: z.array(YoutubeSearchResult),
});

export type YoutubeVideoListResponseItem = z.infer<typeof YoutubeVideoListResponseItem>;
export const YoutubeVideoListResponseItem = z.object({
  kind: z.literal('youtube#video'),
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    channelTitle: z.string(),
  }),
});

export type YoutubeVideoListResponse = z.infer<typeof YoutubeVideoListResponse>;
export const YoutubeVideoListResponse = z.object({
  kind: z.literal('youtube#videoListResponse'),
  items: z.array(YoutubeVideoListResponseItem),
});

export type YoutubePlaylistItemListResponseItem = z.infer<
  typeof YoutubePlaylistItemListResponseItem
>;
export const YoutubePlaylistItemListResponseItem = z.object({
  kind: z.literal('youtube#playlistItem'),
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    channelTitle: z.string(),
    resourceId: z.object({
      kind: z.literal('youtube#video'),
      videoId: z.string(),
    }),
  }),
});

export type YoutubePlaylistItemListResponse = z.infer<typeof YoutubePlaylistItemListResponse>;
export const YoutubePlaylistItemListResponse = z.object({
  kind: z.literal('youtube#playlistItemListResponse'),
  items: z.array(YoutubePlaylistItemListResponseItem),
  pageInfo: z.object({ totalResults: z.number() }),
});

export interface QueryResult {
  videoId: string;
  title: string;
  channelTitle: string;
}

const normaliseYoutubeUrl = (url: string) =>
  url
    .replace('music.youtube.com', 'youtube.com')
    .replace('youtu.be/', 'youtube.com/watch?v=')
    .replace('youtube.com/embed/', 'youtube.com/watch?v=')
    .replace('/v/', '/watch?v=')
    .replace('/watch#', '/watch?')
    .replace('/playlist', '/watch')
    .replace('youtube.com/shorts/', 'youtube.com/watch?v=');

const tracer = trace.getTracer('youtube');

export class Youtube {
  private static instance?: AxiosInstance;

  private static assertInstance(): AxiosInstance {
    if (Youtube.instance) {
      return Youtube.instance;
    }

    const instance = axios.create({
      baseURL: config.YOUTUBE_BASE_URL,
      params: { key: config.YOUTUBE_API_KEY },
    });

    instance.interceptors.request.use((config) => {
      log.info({
        event: 'Youtube.api',
        method: config.method,
        url: config.url,
        params: config.params,
      });
      return config;
    });

    Youtube.instance = instance;
    return Youtube.instance;
  }

  private constructor() {
    Youtube.assertInstance();
  }

  @TraceMethod(tracer, 'youtube/search')
  static async search(query: string, limit = 1) {
    addSpanAttributes({ query });
    return Youtube.assertInstance().get<YoutubeSearchListResult>('/search', {
      params: {
        part: 'snippet',
        order: 'relevance',
        safeSearch: 'none',
        type: 'video',
        maxResults: limit,
        q: query,
      },
    });
  }

  @TraceMethod(tracer, 'youtube/get')
  static async get(id: string) {
    addSpanAttributes({ video_id: id });
    return Youtube.assertInstance().get<YoutubeVideoListResponse>('/videos', {
      params: {
        part: 'snippet',
        id,
      },
    });
  }

  @TraceMethod(tracer, 'youtube/list')
  static async list(playlistId: string, limit = 25) {
    addSpanAttributes({ playlist_id: playlistId });
    return Youtube.assertInstance().get<YoutubePlaylistItemListResponse>('/playlistItems', {
      params: {
        part: 'snippet',
        maxResults: limit,
        playlistId,
      },
    });
  }

  @TraceMethod(tracer, 'youtube/query')
  static async query(raw: string, fuzzySearchLimit = 1): Promise<QueryResult[] | null> {
    if (raw.includes('spotify.com')) {
      const url = new URL(raw);
      log.info({ event: 'youtube', path: url.pathname, message: 'searching with spotify' });
      const tracks = await Spotify.query(url.pathname);
      if (!tracks) {
        return null;
      }

      const results = await Promise.all(
        tracks.map(async (track) => {
          const artists = track.artists.map((artist) => artist.name);
          const terms = [...artists, track.album?.name, track.name].filter(Boolean);
          return Youtube.search(terms.join(' '), 1);
        }),
      );

      return results.flatMap((item) =>
        item.data.items.map((item) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
        })),
      );
    }

    if (raw.includes('youtube.com')) {
      const url = new URL(normaliseYoutubeUrl(raw));
      const playlistId = url.searchParams.get('list');
      if (playlistId) {
        addSpanAttributes({ playlist_id: playlistId });
        log.info({ event: 'youtube', playlistId, message: 'searching by playlist id' });
        const response = await Youtube.list(playlistId)
          .then((result) => result.data)
          .catch((error) => {
            log.error({ event: 'youtube', error, url: url.toString(), playlistId });
            addSpanError(error);
            return null;
          });

        if (response?.items?.length) {
          return response.items.map((item) => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
          }));
        }
      }

      const videoId = url.searchParams.get('v');
      if (videoId) {
        addSpanAttributes({ video_id: videoId });
        log.info({ event: 'youtube', videoId, message: 'searching by video id' });
        const response = await Youtube.get(videoId)
          .then((result) => result.data)
          .catch((error) => {
            log.error({ event: 'youtube', error, url: url.toString(), id: videoId });
            addSpanError(error);
            return null;
          });

        if (response?.items?.length) {
          return [
            {
              videoId: response.items[0].id,
              title: response.items[0].snippet.title,
              channelTitle: response.items[0].snippet.channelTitle,
            },
          ];
        }
      }
    }

    addSpanAttributes({ query: raw });
    log.info({ event: 'youtube', raw, message: 'fuzzy text search' });
    const response = await Youtube.search(raw, fuzzySearchLimit).catch((error) => {
      log.error({ event: 'youtube', error, raw });
      addSpanError(error);
      return null;
    });

    if (!response?.data.items.length) {
      return null;
    }

    return response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
    }));
  }
}
