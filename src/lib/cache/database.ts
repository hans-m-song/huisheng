import { Client, ResultSet, createClient } from '@libsql/client';
import { ZodSchema, z } from 'zod';

import { config, log } from '../../config';

export const expandResultSet = (results: ResultSet): any[] => {
  if (results.rows.length < 1) {
    return [];
  }

  const expand = (row: any[]) =>
    row.reduce((acc, value, index) => ({ ...acc, [results.columns[index]]: value }), {});

  return results.rows.map((row) => expand(Array.from(row)));
};

export let client = createClient({
  url: config.cacheDatabaseUrl,
  authToken: config.cacheDatabaseAuthToken,
});

export const setClient = (newClient: Client) => {
  client = newClient;
};

export class Pagination {
  limit: number;
  offset: number;

  constructor(limit: number, offset: number) {
    this.limit = limit;
    this.offset = offset;
  }

  static fromAny(input: any) {
    const limitRaw = parseInt(input?.limit);
    const offsetRaw = parseInt(input?.offset);
    const limit = !isNaN(limitRaw) ? limitRaw : 5;
    const offset = !isNaN(offsetRaw) ? offsetRaw : 0;
    return new Pagination(limit, offset);
  }
}

export const exec = (namespace: string) => ({
  one: async <Schema extends ZodSchema>(
    name: string,
    schema: Schema,
    sql: string,
    args: any,
  ): Promise<z.infer<typeof schema>[]> => {
    const results = await client.execute({ sql, args });
    const rows = results.rows;
    log.debug({ event: `${namespace}.${name}`, sql, args, rows });
    return rows.map((row) => schema.parse(row));
  },

  many: async <Schema extends ZodSchema>(
    name: string,
    schema: Schema,
    sql: string,
    argsList: any[],
  ): Promise<z.infer<typeof schema>[][]> => {
    const results = await client.batch(argsList.map((args) => ({ sql, args })));
    const sets = results.map((result) => result.rows);
    log.debug({ event: `${namespace}.${name}`, sql, args: argsList, sets });
    return sets.map((rows) => rows.map((row) => schema.parse(row)));
  },
});
