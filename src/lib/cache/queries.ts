/**
 * tables: `query`
 *
 * args: `query`
 */
export const incrementQueryHits = `UPDATE query SET hits = hits + 1 WHERE query LIKE $query RETURNING *`;

/**
 * tables: `query`
 *
 * args: `query`, `songId`
 */
export const insertQuery = `INSERT OR REPLACE INTO query (query, songId) VALUES ($query, $songId) RETURNING *`;

/**
 * tables: `queue`
 *
 * args: `channelId`
 */
export const clearQueue = `DELETE FROM queue WHERE channelId = $channelId`;

/**
 * tables: `queue`
 *
 * args: `channelId`
 */
export const dequeueNext = `UPDATE queue SET played = TRUE WHERE sortOrder = (SELECT sortOrder FROM queue WHERE channelId = $channelId AND played = FALSE ORDER BY id ASC LIMIT 1) RETURNING *`;

/**
 * tables: `queue`
 *
 * args: `channelId`, `limit`, `offset`
 */
export const listQueue = `SELECT * FROM queue INNER JOIN song ON queue.songId = song.songId WHERE channelId = $channelId AND played = FALSE ORDER BY sortOrder ASC LIMIT $limit OFFSET $offset`;

/**
 * tables: `queue`
 *
 * args: `channelId`, `songId`
 */
export const enqueue = `INSERT INTO queue (channelId, sortOrder, songId) VALUES ($channelId, (SELECT IFNULL(MAX(sortOrder), 0) + 1 FROM queue), $songId) RETURNING *`;

/**
 * tables: `queue`
 *
 * args: `channelId`, `sortOrder`
 */
export const dequeueBySortOrder = `UPDATE queue SET played = TRUE WHERE channelId = $channelId AND sortOrder = $sortOrder RETURNING *`;

/**
 * tables: `queue`
 *
 * args: N/A
 */
export const listChannels = `SELECT DISTINCT channelId FROM queue`;

/**
 * tables: `song`
 *
 * args: `limit`, `offset`
 */
export const listQueriedSongs = `SELECT * FROM song INNER JOIN query ON query.songId = song.songId ORDER BY hits DESC LIMIT $limit OFFSET $offset`;

/**
 * tables: `song`
 *
 * args: `limit`, `offset`
 */
export const listSongs = `SELECT * FROM song LIMIT $limit OFFSET $offset`;

/**
 * tables: `song`
 *
 * args: `songId`
 */
export const deleteSongbyId = `DELETE FROM song WHERE songId = $songId RETURNING *`;

/**
 * tables: `song`
 *
 * args: `songId`
 */
export const getSongById = `SELECT * FROM song WHERE songId = $songId LIMIT 1`;

/**
 * tables: `song`
 *
 * args: `songId`, `songTitle`, `songUrl`, `artistId`, `artistTitle`, `artistUrl`, `thumbnail`, `duration`
 */
export const insertSong = `INSERT OR REPLACE INTO song (songId, songTitle, songUrl, artistId, artistTitle, artistUrl, thumbnail, duration) VALUES ($songId, $songTitle, $songUrl, $artistId, $artistTitle, $artistUrl, $thumbnail, $duration) RETURNING *`;

/**
 * tables: `song`, `query`
 *
 * args: `query`
 */
export const matchQuery = `SELECT * FROM song WHERE songId = (SELECT songId FROM query WHERE query LIKE $query LIMIT 1)`;
