const shrink = (input: string) => input.trim().replace(/\s+/g, ' ');

export const getSong = shrink(`
SELECT *
FROM song
WHERE songId = $songId
`);

export const deleteSong = shrink(`
DELETE FROM song
WHERE songId = $songId
RETURNING *
`);

export const listSongs = shrink(`
SELECT *
FROM song
LIMIT $limit
OFFSET $offset
`);

export const setSong = shrink(`
INSERT OR REPLACE INTO song (songId, songTitle, songUrl, artistId, artistTitle, artistUrl, thumbnail, duration)
VALUES ($songId, $songTitle, $songUrl, $artistId, $artistTitle, $artistUrl, $thumbnail, $duration)
RETURNING *
`);

export const enqueueSong = shrink(`
INSERT INTO queue (channelId, sortOrder, songId)
VALUES ($channelId, (SELECT IFNULL(MAX(sortOrder), 0) + 1 FROM queue), $songId)
RETURNING *
`);

export const setQueueItemPlayed = shrink(`
UPDATE queue
SET played = TRUE
WHERE channelId = $channelId AND sortOrder = $sortOrder
RETURNING *
`);

export const dequeueSong = shrink(`
UPDATE queue
SET played = TRUE
WHERE sortOrder = (
  SELECT sortOrder
  FROM queue
  WHERE channelId = $channelId AND played = FALSE
  ORDER BY id ASC
  LIMIT 1
)
RETURNING *
`);

export const listQueue = shrink(`
SELECT *
FROM queue
INNER JOIN song ON queue.songId = song.songId
WHERE channelId = $channelId AND played = FALSE
LIMIT $limit
OFFSET $offset
`);

export const clearQueue = shrink(`
DELETE FROM queue
WHERE channelId = $channelId
`);

export const setQuery = shrink(`
INSERT OR REPLACE INTO query (query, songId)
VALUES ($query, $songId)
RETURNING *
`);

export const incrementQueryHits = shrink(`
UPDATE query
SET hits = hits + 1
WHERE queryId = $queryId
RETURNING *
`);

export const searchQuery = shrink(`
SELECT *
FROM song
WHERE songId = (
  SELECT songId
  FROM query
  WHERE query LIKE '%$query%'
  LIMIT 1
)
`);

export const listQueries = shrink(`
SELECT *
FROM song
INNER JOIN query ON query.songId = song.songId
ORDER BY hits DESC
LIMIT $limit
OFFSET $offset
`);
