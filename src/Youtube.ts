import axios from 'axios';

import { config } from './config';
import { logError } from './utils';

const MATCH_VIDEO_HREF = /^https:\/\/((www|music)\.)?youtube.com\/watch\?v=[^\s]+$/;

export interface YoutubeSearchListResult {
  kind: 'youtube#searchListResponse'
  etag: string
  nextPageToken: string
  regionCode: string
  pageInfo: {
    totalResults: 1000000
    resultsPerPage: 5
  },
  items: YoutubeSearchResult[]
}

export interface YoutubeSearchResult {
  kind: 'youtube#searchResult'
  etag: string
  id: {
    kind: 'youtube#video'
    videoId: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      [key: string]: {
        url: string
        width: number
        height: number
      }
    },
    channelTitle: string,
    liveBroadcastContent: string
  }
}

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

const get = (id: string) => api.get('/videos', {
  params: { part: 'snippet', id },
});

const query = async (raw: string): Promise<YoutubeSearchResult | null> => {
  if (MATCH_VIDEO_HREF.test(raw)) {
    const id = new URL(raw).searchParams.get('v');
    if (!id) {
      return null;
    }

    return get(id).then((result) => result.data).catch((error) => {
      logError('youtube', error, { raw });
      return null;
    });
  }

  const response = await search(raw).catch((error) => {
    logError('youtube', error, { query: raw });
    return null;
  });

  if (!response?.data.items.length) {
    return null;
  }

  return response.data.items[0];
};

export const youtube = { query };
