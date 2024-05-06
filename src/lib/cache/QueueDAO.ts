import { z } from 'zod';

import { Pagination, client, expandResultSet } from './database';
import * as queries from './queries';
import { SongSchema } from './SongDAO';
import { log } from '../../config';

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
  static async enqueue(channelId: string, songId: string) {
    const statement = { sql: queries.enqueueSong, args: { channelId, songId } };
    const result = await client.execute(statement);
    const queueItem = QueueItemSchema.parse(expandResultSet(result)[0]);
    log.debug({ event: 'QueueDAO.enqueue', statement, queueItem });
    return queueItem;
  }

  static async dequeue(channelId: string): Promise<QueuedSong | null> {
    const statement = { sql: queries.dequeueSong, args: { channelId } };
    const result = await client.execute(statement);
    const queuedSong = QueuedSongSchema.parse(expandResultSet(result)[0]);
    log.debug({ event: 'QueueDAO.dequeue', statement, queuedSong });
    return queuedSong;
  }

  static async list(channelId: string, pagination?: Pagination): Promise<QueuedSong[]> {
    const statement = {
      sql: queries.listQueue,
      args: { channelId, limit: 5, offset: 0, ...pagination },
    };
    const result = await client.execute(statement);
    const queue = expandResultSet(result).map((item) => QueuedSongSchema.parse(item));
    log.debug({ event: 'QueueDAO.list', statement, queue });
    return queue;
  }

  static async delete(channelId: string, sortOrder: number): Promise<QueueItem> {
    const statement = { sql: queries.setQueueItemPlayed, args: { channelId, sortOrder } };
    const result = await client.execute(statement);
    const queueItem = QueueItemSchema.parse(expandResultSet(result)[0]);
    log.debug({ event: 'QueueDAO.delete', statement, queueItem });
    return queueItem;
  }

  static async clear() {
    const statement = { sql: queries.clearQueue, args: {} };
    const result = await client.execute(queries.clearQueue);
    log.debug({ event: 'QueueDAO.clear', statement, rowsAffected: result.rowsAffected });
  }
}
