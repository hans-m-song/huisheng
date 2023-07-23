import axios, { AxiosInstance } from 'axios';
import { isMatching, P } from 'ts-pattern';

import { config } from '../config';
import { Spotify } from './Spotify';
import { GuardType, logError, logEvent } from './utils';

export type YoutubeSearchResult = GuardType<typeof isYoutubeSearchResult>;
export const isYoutubeSearchResult = isMatching({
  kind: 'youtube#searchResult',
  id: {
    kind: 'youtube#video',
    videoId: P.string,
  },
  snippet: {
    title: P.string,
    channelTitle: P.string,
  },
});

export type YoutubeSearchListResult = GuardType<typeof isYoutubeSearchListResult>;
const isYoutubeSearchListResult = isMatching({
  kind: 'youtube#searchListResponse',
  items: P.array(P.when(isYoutubeSearchResult)),
});

export type YoutubeVideoListResponseItem = GuardType<typeof isYoutubeVideoListResponseItem>;
export const isYoutubeVideoListResponseItem = isMatching({
  kind: 'youtube#video',
  id: P.string,
  snippet: {
    title: P.string,
    channelTitle: P.string,
  },
});

export type YoutubeVideoListResponse = GuardType<typeof isYoutubeVideoListResponse>;
export const isYoutubeVideoListResponse = isMatching({
  kind: 'youtube#videoListResponse',
  items: P.array(P.when(isYoutubeVideoListResponseItem)),
});

export type YoutubePlaylistItemListResponseItem = GuardType<
  typeof isYoutubePlaylistItemListResponseItem
>;
export const isYoutubePlaylistItemListResponseItem = isMatching({
  kind: 'youtube#playlistItem',
  id: P.string,
  snippet: {
    title: P.string,
    channelTitle: P.string,
    resourceId: {
      kind: 'youtube#video',
      videoId: P.string,
    },
  },
});

export type YoutubePlaylistItemListResponse = GuardType<typeof isYoutubePlaylistItemListResponse>;
export const isYoutubePlaylistItemListResponse = isMatching({
  kind: 'youtube#playlistItemListResponse',
  items: P.array(P.when(isYoutubePlaylistItemListResponseItem)),
  pageInfo: { totalResults: P.number },
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

export class Youtube {
  private static instance?: AxiosInstance;

  private static assertInstance(): AxiosInstance {
    if (Youtube.instance) {
      return Youtube.instance;
    }

    const instance = axios.create({
      baseURL: config.youtubeBaseUrl,
      params: { key: config.youtubeApiKey },
    });

    instance.interceptors.request.use((config) => {
      logEvent('Youtube.api', { method: config.method, url: config.url, params: config.params });
      return config;
    });

    Youtube.instance = instance;
    return Youtube.instance;
  }

  private constructor() {
    Youtube.assertInstance();
  }

  static search = (query: string, limit = 1) =>
    Youtube.assertInstance().get<YoutubeSearchListResult>('/search', {
      params: {
        part: 'snippet',
        order: 'relevance',
        safeSearch: 'none',
        type: 'video',
        maxResults: limit,
        q: query,
      },
    });

  static get = (id: string) =>
    Youtube.assertInstance().get<YoutubeVideoListResponse>('/videos', {
      params: {
        part: 'snippet',
        id,
      },
    });

  static list = (playlistId: string, limit = 25) =>
    Youtube.assertInstance().get<YoutubePlaylistItemListResponse>('/playlistItems', {
      params: {
        part: 'snippet',
        maxResults: limit,
        playlistId,
      },
    });

  static query = async (raw: string, fuzzySearchLimit = 1): Promise<QueryResult[] | null> => {
    if (raw.includes('spotify.com')) {
      const url = new URL(raw);
      logEvent('youtube', { path: url.pathname, message: 'searching with spotify' });
      const tracks = await Spotify.query(url.pathname);
      if (!tracks) {
        return null;
      }

      const results = await Promise.all(tracks.map(async (track) => Youtube.search(track.name, 1)));

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
        logEvent('youtube', { playlistId, message: 'searching by playlist id' });
        const response = await Youtube.list(playlistId)
          .then((result) => result.data)
          .catch((error) => {
            logError('youtube', error, { url: url.toString(), playlistId });
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
        logEvent('youtube', { videoId, message: 'searching by video id' });
        const response = await Youtube.get(videoId)
          .then((result) => result.data)
          .catch((error) => {
            logError('youtube', error, { url: url.toString(), id: videoId });
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

    logEvent('youtube', { raw, message: 'fuzzy text search' });
    const response = await Youtube.search(raw, fuzzySearchLimit).catch((error) => {
      logError('youtube', error, { raw });
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
  };
}
