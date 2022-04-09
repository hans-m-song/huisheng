export {};

// import { Database } from '@vscode/sqlite3'; // required to work on node v16
// import path from 'path';
// import { promisify } from 'util';

// import { config } from '../config';
// import { AudioFile } from './AudioFile';
// import { logEvent } from './utils';

// const fileColumns = `
//   file_id    INTEGER PRIMARY KEY AUTOINCREMENT,
//   video_id   TEXT    NOT NULL UNIQUE,
//   url        TEXT    NOT NULL UNIQUE,
//   title      TEXT,
//   artist     TEXT,
//   uploader   TEXT,
//   duration   INTEGER,
//   created_at INTEGER NOT NULL,
//   read_at    INTEGER NOT NULL
// `;

// const createTables = `
// CREATE TABLE IF NOT EXISTS file (${fileColumns}) WITHOUT ROWID;
// `;

// const insertFile = (file: AudioFile) => `
// INSERT INTO file
//   (video_id, url, title, artist, uploader, duration, created_at, read_at)
// VALUES
//   (${[
//     `"${file.videoId}"`,
//     `"${file.url}"`,
//     file.title ? `"${file.title}"` : 'NULL',
//     file.artist ? `"${file.artist}"` : 'NULL',
//     file.uploader ? `"${file.uploader}"` : 'NULL',
//     file.duration ?? 'NULL',
//     Date.now(),
//     Date.now(),
//   ].join(', ')})
// `; // TODO "ON CONFLICT"

// const selectFile = (query: string) => `
// SELECT *
// FROM file
// WHERE
//   video_id = "${query}"
//   OR url = "${query}"
//   OR title LIKE "%${query}%"
// `;

// const dbDir = path.join(config.cacheDir, 'data');
// export const db = new Database(dbDir);

// const exec = promisify(db.exec);

// const close = async () => {
//   logEvent('database', 'closing');
//   return promisify(db.close);
// };

// const get = (sql: string) =>
//   new Promise((resolve, reject) =>
//     db.get(sql, (err, row) =>
//       err ? reject(err) : resolve(row)));

// const init = async () => {
//   logEvent('database', 'initializing');
//   return exec(createTables);
// };

// const insert = async (file: AudioFile) => {
//   logEvent('database', 'inserting', file.toJSON());
//   return exec(insertFile(file));
// };

// const select = async (query: string) => {
//   logEvent('database', 'querying', query);
//   const result = await get(selectFile(query));
//   return result;
// };

// export const database = { close, init , insert, select };
