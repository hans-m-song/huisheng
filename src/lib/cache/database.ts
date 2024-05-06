import { Client, ResultSet, createClient } from '@libsql/client';

import { config } from '../../config';

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
