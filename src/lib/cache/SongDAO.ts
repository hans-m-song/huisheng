import { z } from 'zod';

import { Pagination, exec } from './database';
import * as queries from './queries';

export const SongSchema = z.object({
  songId: z.string(),
  songTitle: z.string(),
  songUrl: z.string(),
  artistId: z.string().nullable(),
  artistTitle: z.string().nullable(),
  artistUrl: z.string().nullable(),
  thumbnail: z.string().nullable(),
  duration: z.number().nullable(),
  cachedAt: z.number().nullable(),
});

export type Song = z.infer<typeof SongSchema>;

export class SongDAO {
  static exec = exec('SongDAO');

  static async put(...input: Song[]): Promise<Song[]> {
    const rows = await SongDAO.exec.many('put', SongSchema, queries.insertSong, input);

    return rows.flat();
  }

  static async get(songId: string): Promise<Song | null> {
    const rows = await SongDAO.exec.one('get', SongSchema, queries.getSongById, { songId });

    return rows[0] ?? null;
  }

  static async delete(songId: string): Promise<Song | null> {
    const rows = await SongDAO.exec.one('delete', SongSchema, queries.deleteSongbyId, { songId });

    return rows[0] ?? null;
  }

  static async list(pagination?: Pagination): Promise<Song[]> {
    const args = { limit: 5, offset: 0, ...pagination };
    return await SongDAO.exec.one('list', SongSchema, queries.listSongs, args);
  }
}
