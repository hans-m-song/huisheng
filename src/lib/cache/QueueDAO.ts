import { z } from 'zod';

import { Pagination, exec } from './database';
import * as queries from './queries';
import { SongSchema } from './SongDAO';

export const QueueItemSchema = z.object({
  channelId: z.string(),
  sortOrder: z.number(),
  songId: z.string(),
  // sqlite stores booleans as 1/0
  played: z.number().transform((val) => val > 0),
});

export type QueueItem = z.infer<typeof QueueItemSchema>;

export const QueuedSongSchema = z.intersection(QueueItemSchema, SongSchema);

export type QueuedSong = z.infer<typeof QueuedSongSchema>;

export class QueueDAO {
  static exec = exec('QueueDAO');

  static async enqueue(channelId: string, songId: string): Promise<QueueItem | null> {
    const rows = await QueueDAO.exec.one('enqueue', QueueItemSchema, queries.enqueue, {
      channelId,
      songId,
    });

    return rows[0] ?? null;
  }

  static async dequeue(channelId: string): Promise<QueueItem | null> {
    const rows = await QueueDAO.exec.one('dequeue', QueueItemSchema, queries.dequeueNext, {
      channelId,
    });

    return rows[0] ?? null;
  }

  static async list(channelId: string, pagination?: Pagination): Promise<QueuedSong[]> {
    return await QueueDAO.exec.one('list', QueuedSongSchema, queries.listQueue, {
      channelId,
      limit: 5,
      offset: 0,
      ...pagination,
    });
  }

  static async listChannels(): Promise<{ channelId: string }[]> {
    return await QueueDAO.exec.one(
      'listChannels',
      z.object({ channelId: z.string() }),
      queries.listChannels,
      {},
    );
  }

  static async delete(channelId: string, sortOrder: number): Promise<QueueItem | null> {
    const rows = await QueueDAO.exec.one('delete', QueueItemSchema, queries.dequeueBySortOrder, {
      channelId,
      sortOrder,
    });

    return rows[0] ?? null;
  }

  static async clear(channelId: string): Promise<void> {
    await QueueDAO.exec.one('clear', QueueItemSchema, queries.clearQueue, {
      channelId,
    });
  }
}
