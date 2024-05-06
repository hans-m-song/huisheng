import { z } from 'zod';

import { Pagination, client, expandResultSet } from './database';
import * as queries from './queries';
import { log } from '../../config';

export const SongSchema = z.object({
  songId: z.string(),
  songTitle: z.string(),
  songUrl: z.string(),
  artistId: z.string().nullable(),
  artistTitle: z.string().nullable(),
  artistUrl: z.string().nullable(),
  thumbnail: z.string().nullable(),
  duration: z.number().nullable(),
  cachedAt: z.number(),
});

export type Song = z.infer<typeof SongSchema>;

export class SongDAO {
  static async put(...input: Song[]) {
    const batch = input.map((song) => ({ sql: queries.setSong, args: song as any }));
    const result = await client.batch(batch, 'write');
    const songs = result.flatMap(expandResultSet).map((item) => SongSchema.parse(item));
    log.debug({ event: 'SongDAO.put', sql: queries.setSong, args: { songs }, songs });
  }

  static async get(songId: string): Promise<Song | null> {
    const statement = { sql: queries.getSong, args: { songId } };
    const result = await client.execute(statement);
    const song = expandResultSet(result)[0] ?? null;
    log.debug({ event: 'SongDAO.get', statement, song });
    return song;
  }

  static async delete(songId: string): Promise<Song[]> {
    const statement = { sql: queries.deleteSong, args: { songId } };
    const result = await client.execute(statement);
    const song = expandResultSet(result)[0] ?? 0;
    log.debug({ event: 'SongDAO.delete', statement, song });
    return song;
  }

  static async list(pagination?: Pagination): Promise<Song[]> {
    const statement = { sql: queries.listSongs, args: { limit: 5, offset: 0, ...pagination } };
    const result = await client.execute(statement);
    const songs = expandResultSet(result).map((item) => SongSchema.parse(item));
    log.debug({ event: 'SongDAO.list', statement, songs });
    return songs;
  }
}
