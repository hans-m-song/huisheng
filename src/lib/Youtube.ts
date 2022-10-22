import axios from 'axios';
import { isMatching, P } from 'ts-pattern';

import { config } from '../config';
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

const api = axios.create({
  baseURL: config.youtubeBaseUrl,
  params: { key: config.youtubeApiKey },
});

const search = (query: string, limit = 1) =>
  api.get<YoutubeSearchListResult>('/search', {
    params: {
      part: 'snippet',
      order: 'relevance',
      safeSearch: 'none',
      type: 'video',
      maxResults: limit,
      q: query,
    },
  });

const get = (id: string) =>
  api.get<YoutubeVideoListResponse>('/videos', {
    params: {
      part: 'snippet',
      id,
    },
  });

const list = (playlistId: string, limit = 25) =>
  api.get<YoutubePlaylistItemListResponse>('/playlistItems', {
    params: {
      part: 'snippet',
      maxResults: limit,
      playlistId,
    },
  });

const normaliseYoutubeUrl = (url: string) =>
  url
    .replace('music.youtube.com', 'youtube.com')
    .replace('youtu.be/', 'youtube.com/watch?v=')
    .replace('youtube.com/embed/', 'youtube.com/watch?v=')
    .replace('/v/', '/watch?v=')
    .replace('/watch#', '/watch?')
    .replace('/playlist', '/watch')
    .replace('youtube.com/shorts/', 'youtube.com/watch?v=');

const MATCH_VIDEO_HREF = /^https:\/\/.*?\.youtube.com\//;

export interface QueryResult {
  videoId: string;
  title: string;
  channelTitle: string;
}

const query = async (raw: string, fuzzySearchLimit = 1): Promise<QueryResult[] | null> => {
  const queryStr = normaliseYoutubeUrl(raw);

  if (MATCH_VIDEO_HREF.test(queryStr)) {
    const { searchParams } = new URL(queryStr);

    const playlistId = searchParams.get('list');
    if (playlistId) {
      logEvent('youtube', 'searching by playlist id', `"${playlistId}"`);
      const response = await list(playlistId)
        .then((result) => result.data)
        .catch((error) => {
          logError('youtube', error, { queryStr, playlistId });
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

    const videoId = searchParams.get('v');
    if (videoId) {
      logEvent('youtube', 'searching by video id', `"${videoId}"`);
      const response = await get(videoId)
        .then((result) => result.data)
        .catch((error) => {
          logError('youtube', error, { queryStr, id: videoId });
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

  logEvent('youtube', 'fuzzy text search', `"${raw}"`);
  const response = await search(raw, fuzzySearchLimit).catch((error) => {
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

export const youtube = { query, get, list };
