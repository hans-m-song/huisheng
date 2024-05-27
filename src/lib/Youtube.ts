import { youtube, youtube_v3 } from '@googleapis/youtube';
import { z } from 'zod';

import { Spotify } from './Spotify';
import { config, log } from '../config';

export type YoutubeSearchResult = youtube_v3.Schema$SearchListResponse;

export type YoutubeVideoListResponseItem = youtube_v3.Schema$VideoListResponse;

export type YoutubePlaylistItemListResponse = youtube_v3.Schema$PlaylistItemListResponse;

export const QueryResultSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelId: z.string(),
  channelTitle: z.string(),
  thumbnail: z.string().optional(),
});

export type QueryResult = z.infer<typeof QueryResultSchema>;

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
  private static client = youtube({
    version: 'v3',
    auth: config.youtubeApiKey,
  });

  static search = (query: string, limit = 1) =>
    Youtube.client.search
      .list({
        part: ['snippet'],
        order: 'relevance',
        safeSearch: 'none',
        type: ['video'],
        maxResults: limit,
        q: query,
      })
      .then((result) => result.data);

  static get = (id: string) =>
    Youtube.client.videos.list({ part: ['snippet'], id: [id] }).then((result) => result.data);

  static list = (playlistId: string, limit = 25) =>
    Youtube.client.playlistItems
      .list({ part: ['snippet'], maxResults: limit, playlistId })
      .then((result) => result.data);

  static query = async (raw: string, fuzzySearchLimit = 1): Promise<QueryResult[] | null> => {
    if (raw.includes('spotify.com')) {
      const url = new URL(raw);
      log.info({
        event: 'youtube',
        path: url.pathname,
        message: 'searching with spotify',
      });
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
        (item.items ?? []).map((item) =>
          QueryResultSchema.parse({
            videoId: item.id?.videoId,
            title: item.snippet?.title,
            channelId: item.snippet?.channelId,
            channelTitle: item.snippet?.channelTitle,
            thumbnail: item.snippet?.thumbnails?.default?.url,
          }),
        ),
      );
    }

    if (raw.includes('youtube.com')) {
      const url = new URL(normaliseYoutubeUrl(raw));

      const videoId = url.searchParams.get('v');
      if (videoId) {
        log.info({
          event: 'youtube',
          videoId,
          message: 'searching by video id',
        });
        const response = await Youtube.get(videoId).catch((error) => {
          log.error({
            event: 'youtube',
            error,
            url: url.toString(),
            id: videoId,
          });
          return null;
        });

        if (response?.items?.length) {
          return [
            QueryResultSchema.parse({
              videoId: response.items?.[0].id,
              title: response.items?.[0].snippet?.title,
              channelId: response.items?.[0].snippet?.channelId,
              channelTitle: response.items?.[0].snippet?.channelTitle,
              thumbnail: response.items?.[0].snippet?.thumbnails?.default?.url,
            }),
          ];
        }
      }

      const playlistId = url.searchParams.get('list');
      if (playlistId) {
        log.info({
          event: 'youtube',
          playlistId,
          message: 'searching by playlist id',
        });

        const response = await Youtube.list(playlistId).catch((error) => {
          log.error({
            event: 'youtube',
            error,
            url: url.toString(),
            playlistId,
          });
          return null;
        });

        if (response?.items?.length) {
          return response.items.map((item) =>
            QueryResultSchema.parse({
              videoId: item.snippet?.resourceId?.videoId,
              title: item.snippet?.title,
              channelId: item.snippet?.channelId,
              channelTitle: item.snippet?.channelTitle,
              thumbnail: item.snippet?.thumbnails?.default?.url,
            }),
          );
        }
      }
    }

    log.info({ event: 'youtube', raw, message: 'fuzzy text search' });
    const response = await Youtube.search(raw, fuzzySearchLimit).catch((error) => {
      log.error({ event: 'youtube', error, raw });
      return null;
    });

    if (response?.items?.length) {
      return response.items.map((item) =>
        QueryResultSchema.parse({
          videoId: item.id?.videoId,
          title: item.snippet?.title,
          channelId: item.snippet?.channelId,
          channelTitle: item.snippet?.channelTitle,
          thumbnail: item.snippet?.thumbnails?.default?.url,
        }),
      );
    }

    return null;
  };
}
