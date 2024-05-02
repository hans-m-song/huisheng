import { ResultSet, createClient } from '@libsql/client';

import * as queries from './cacheQueries';
import { config, log } from '../config';

export interface Song {
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelTitle: string;
  duration: number;
  cachedAt: number;
}

export interface QueueItem {
  videoId: string;
  sortOrder: number;
  played: boolean;
}

export type QueuedSong = QueueItem & Song;

export interface Query {
  query: string;
  videoId: string;
  hits: number;
}

export type QueriedSong = Query & Song;

const expandResultSet = (results: ResultSet): any[] => {
  if (results.rows.length < 1) {
    return [];
  }

  const expand = (row: any[]) =>
    row.reduce((acc, value, index) => ({ ...acc, [results.columns[index]]: value }), {});

  return results.rows.map((row) => expand(Array.from(row)));
};

const client = createClient({
  url: config.cacheDatabaseUrl,
  authToken: config.cacheDatabaseAuthToken,
});

export class Cache {
  static async migrate() {
    const result = await client.batch(
      [queries.createSongTable, queries.createQueueTable, queries.createQueryTable],
      'write',
    );
    log.info({ event: 'Cache.migrate', result: result.map(expandResultSet) });
  }

  static async setSongs(songs: Song[]) {
    const batch = songs.map((song) => ({ sql: queries.setSong, args: song as any }));
    const result = await client.batch(batch, 'write');
    log.info({ event: 'Cache.setSongs', songs, result: result.map(expandResultSet) });
  }

  static async getSong(videoId: string): Promise<Song | null> {
    const result = await client.execute({ sql: queries.getSong, args: { videoId } });
    const song = expandResultSet(result)[0] ?? null;
    log.info({ event: 'Cache.getSong', videoId, song });
    return song;
  }

  static async listSongs(): Promise<Song[]> {
    const result = await client.execute(queries.listSongs);
    const songs = expandResultSet(result);
    log.info({ event: 'Cache.listSong', songs });
    return songs;
  }

  static async enqueueSong(videoId: string) {
    const result = await client.execute({
      sql: queries.enqueueSong,
      args: { videoId },
    });
    log.info({ event: 'Cache.enqueueSong', videoId, result: expandResultSet(result) });
  }

  static async dequeueSong(): Promise<QueueItem | null> {
    const result = await client.execute(queries.dequeueSong);
    const song = expandResultSet(result)[0] ?? null;
    log.info({ event: 'Cache.dequeueSong', song });
    return song;
  }

  static async listQueue(): Promise<QueuedSong[]> {
    const result = await client.execute(queries.listQueue);
    const queue = expandResultSet(result);
    log.info({ event: 'Cache.listQueue', queue });
    return queue;
  }

  static async removeQueueItem(index: number) {
    const result = await client.execute({
      sql: queries.setQueueItemPlayed,
      args: { sortOrder: index },
    });
    log.info({ event: 'Cache.removeQueueItem', index, result: expandResultSet(result) });
  }

  static async clearQueue() {
    const result = await client.execute(queries.clearQueue);
    log.info({ event: 'Cache.clearQueue', result: expandResultSet(result) });
  }

  static async setQuery(query: string, song: Song) {
    const result = await client.batch([
      { sql: queries.setQuery, args: { query, videoId: song.videoId } },
      { sql: queries.setSong, args: song as any },
    ]);
    const results = result.map(expandResultSet);
    log.info({ event: 'Cache.setQuery', query: results?.[0]?.[0], song: results?.[1]?.[0] });
  }

  static async incrementQueryHits(query: string) {
    const result = await client.execute({
      sql: queries.incrementQueryHits,
      args: { query },
    });
    log.info({ event: 'Cache.incrementQueryHits', result: expandResultSet(result) });
  }

  static async searchQuery(query: string): Promise<Song | null> {
    const result = await client.execute({
      sql: queries.searchQuery,
      args: { query },
    });
    const song = expandResultSet(result)[0] ?? null;
    if (song) {
      await Cache.incrementQueryHits(query);
    }
    log.info({ event: 'Cache.searchQuery', query, song });
    return song;
  }

  static async listQueries(): Promise<QueriedSong[]> {
    const result = await client.execute(queries.listQueries);
    const query = expandResultSet(result);
    log.info({ event: 'Cache.listQuery', query });
    return query;
  }
}
