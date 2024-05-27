import { InStatement } from '@libsql/client';
import { z } from 'zod';

import { Pagination, client, exec, expandResultSet } from './database';
import * as queries from './queries';
import { Song, SongSchema } from './SongDAO';
import { log } from '../../config';

export const QueryItemSchema = z.object({
  queryId: z.number(),
  query: z.string(),
  songId: z.string(),
  hits: z.number(),
});

export type QueryItem = z.infer<typeof QueryItemSchema>;

export const QueriedSongSchema = z.intersection(QueryItemSchema, SongSchema);

export type QueriedSong = QueryItem & Song;

const querify = (input: string) => '%' + input.replace(/[^a-z0-9]/gi, '') + '%';

export class QueryDAO {
  static exec = exec('QueryDAO');

  static async set(rawQuery: string, inputSong: Song): Promise<QueryItem> {
    const query = querify(rawQuery);
    const batch: InStatement[] = [
      { sql: queries.insertQuery, args: { query, songId: inputSong.songId } },
      { sql: queries.insertSong, args: { ...inputSong } },
    ];
    const result = await client.batch(batch);
    const results = result.map(expandResultSet);
    const queryItem = QueryItemSchema.parse(results[0][0]);
    const song = SongSchema.parse(results[1][0]);
    log.debug({ event: 'QueryDAO.set', batch, queryItem, song });
    return queryItem;
  }

  static async search(rawQuery: string): Promise<Song | null> {
    const query = querify(rawQuery);
    const batch: InStatement[] = [
      { sql: queries.matchQuery, args: { query } },
      { sql: queries.incrementQueryHits, args: { query } },
    ];

    const result = await client.batch(batch);
    const results = result.map(expandResultSet);
    if (results[0].length < 1) {
      log.debug({ event: 'QueryDAO.search', batch, queriedSong: null, queryItem: null });
      return null;
    }

    const queriedSong = SongSchema.parse(results[0][0]);
    const queryItem = QueryItemSchema.parse(results[1][0]);
    log.debug({ event: 'QueryDAO.search', batch, queriedSong, queryItem });
    return results[1][0];
  }

  static async list(pagination?: Pagination): Promise<QueriedSong[]> {
    const statement = {
      sql: queries.listQueriedSongs,
      args: { limit: 5, offset: 0, ...pagination },
    };
    const result = await client.execute(statement);
    const query = expandResultSet(result).map((item) => QueriedSongSchema.parse(item));
    log.debug({ event: 'QueryDAO.list', statement, query });
    return query;
  }
}
