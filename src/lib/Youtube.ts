import axios from 'axios';
import { isMatching, P } from 'ts-pattern';

import { config } from '../config';
import { GuardType, logError } from './utils';

export type YoutubeSearchResult = GuardType<typeof isYoutubeSearchResult>
export const isYoutubeSearchResult = isMatching({
  kind: 'youtube#searchResult',
  id:   {
    kind:    'youtube#video',
    videoId: P.string,
  },
  snippet: {
    title:        P.string,
    channelTitle: P.string,
  },
});

export type YoutubeSearchListResult = GuardType<typeof isYoutubeSearchListResult>
const isYoutubeSearchListResult = isMatching({
  kind:  'youtube#searchListResponse',
  items: P.array(P.when(isYoutubeSearchResult)),
});

export type YoutubeVideoListResponseItem = GuardType<typeof isYoutubeVideoListResponseItem>
export const isYoutubeVideoListResponseItem = isMatching({
  'kind':  'youtube#video',
  id:      P.string,
  snippet: {
    title:        P.string,
    channelTitle: P.string,
  },
});

export type YoutubeVideoListResponse = GuardType<typeof isYoutubeVideoListResponse>
export const isYoutubeVideoListResponse = isMatching({
  kind:  'youtube#videoListResponse',
  items: P.array(P.when(isYoutubeVideoListResponseItem)),
});

const api = axios.create({
  baseURL: config.youtubeBaseUrl,
  params:  { key: config.youtubeApiKey },
});

const search = (query: string, limit = 1) =>
  api.get<YoutubeSearchListResult>('/search', {
    params: {
      part:       'snippet',
      order:      'relevance',
      safeSearch: 'none',
      type:       'video',
      maxResults: limit,
      q:          query,
    },
  });

const get = (id: string) =>
  api.get<YoutubeVideoListResponse>('/videos', {
    params: {
      part: 'snippet',
      id,
    },
  });

const normaliseYoutubeUrl = (url: string) =>
  url
    .replace('youtu.be/', 'youtube.com/watch?v=')
    .replace('youtube.com/embed/', 'youtube.com/watch?v=')
    .replace('/v/', '/watch?v=')
    .replace('/watch#', '/watch?')
    .replace('youtube.com/shorts/', 'youtube.com/watch?v=');

const MATCH_VIDEO_HREF = /^https:\/\/(www\.)?youtube.com\/watch\?v=[^\s]+$/;

export interface QueryResult {
  videoId: string
  title: string
  channelTitle: string
}

const query = async (raw: string): Promise<QueryResult | null> => {
  const queryStr = normaliseYoutubeUrl(raw);

  if (MATCH_VIDEO_HREF.test(queryStr)) {
    const id = new URL(queryStr).searchParams.get('v');
    if (!id) {
      return null;
    }

    const response = await get(id).then((result) => result.data).catch((error) => {
      logError('youtube', error, { queryStr });
      return null;
    });

    if (response?.items?.length) {
      return {
        videoId:      response.items[0].id ,
        title:        response.items[0].snippet.title,
        channelTitle: response.items[0].snippet.channelTitle,
      };
    }

  }

  const response = await search(queryStr).catch((error) => {
    logError('youtube', error, { queryStr });
    return null;
  });

  if (!response?.data.items.length) {
    return null;
  }

  return {
    videoId:      response.data.items[0].id.videoId,
    title:        response.data.items[0].snippet.title,
    channelTitle: response.data.items[0].snippet.channelTitle,
  };
};

export const youtube = { query, get };
