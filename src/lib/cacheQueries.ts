export const createSongTable = `
CREATE TABLE IF NOT EXISTS song (
  videoId TEXT PRIMARY KEY ON CONFLICT REPLACE,
  videoTitle TEXT NOT NULL,
  channelId TEXT NOT NULL,
  channelTitle TEXT NOT NULL,
  duration INTEGER NOT NULL,
  cachedAt INTEGER NOT NULL
)
`.trim();

export const createQueueTable = `
CREATE TABLE IF NOT EXISTS queue (
  sortOrder INTEGER PRIMARY KEY AUTOINCREMENT,
  videoId TEXT NOT NULL,
  played BOOLEAN DEFAULT FALSE
)
`.trim();

export const createQueryTable = `
CREATE TABLE IF NOT EXISTS query (
  query TEXT NOT NULL ON CONFLICT REPLACE,
  videoId TEXT NOT NULL,
  hits INTEGER NOT NULL
)
`.trim();

export const getSong = `
SELECT *
FROM song
WHERE videoId = $videoId
`.trim();

export const listSongs = `
SELECT *
FROM song
`.trim();

export const setSong = `
INSERT OR REPLACE INTO song (videoId, videoTitle, channelId, channelTitle, duration, cachedAt)
VALUES ($videoId, $videoTitle, $channelId, $channelTitle, $duration, $cachedAt)
`.trim();

export const enqueueSong = `
INSERT INTO queue (videoId)
VALUES ($videoId)
`.trim();

export const setQueueItemPlayed = `
UPDATE queue
SET played = TRUE
WHERE sortOrder = $sortOrder
RETURNING *
`.trim();

export const dequeueSong = `
UPDATE queue
SET played = TRUE
WHERE sortOrder = (
  SELECT sortOrder
  FROM queue
  WHERE played = FALSE
  ORDER BY sortOrder ASC
  LIMIT 1
)
RETURNING *
`.trim();

export const listQueue = `
SELECT *
FROM queue
INNER JOIN song ON song.videoId = queue.videoId
WHERE played = FALSE
`.trim();

export const clearQueue = `
DELETE FROM queue
`.trim();

export const setQuery = `
INSERT OR REPLACE INTO query (query, videoId, hits)
VALUES ($query, $videoId, 1)
`.trim();

export const incrementQueryHits = `
UPDATE query
SET hits = hits + 1
WHERE query = $query
RETURNING *
`.trim();

export const searchQuery = `
SELECT *
FROM song
WHERE videoId = (
  SELECT videoId
  FROM query
  WHERE query LIKE '%$query%'
  LIMIT 1
)
`.trim();

export const listQueries = `
SELECT *
FROM song
INNER JOIN query ON song.videoId = query.videoId
ORDER BY hits DESC
`.trim();
