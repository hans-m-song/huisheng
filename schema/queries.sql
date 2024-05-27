-- name: getSongById :one
SELECT *
FROM song
WHERE songId = $songId
LIMIT 1;

-- name: deleteSongbyId :one
DELETE FROM song
WHERE songId = $songId
RETURNING *;

-- name: listSongs :many
SELECT *
FROM song
LIMIT $limit OFFSET $offset;

-- name: insertSong :one
INSERT
  OR REPLACE INTO song (
    songId,
    songTitle,
    songUrl,
    artistId,
    artistTitle,
    artistUrl,
    thumbnail,
    duration
  )
VALUES (
    $songId,
    $songTitle,
    $songUrl,
    $artistId,
    $artistTitle,
    $artistUrl,
    $thumbnail,
    $duration
  )
RETURNING *;

-- name: enqueue :one
INSERT INTO queue (channelId, sortOrder, songId)
VALUES (
    $channelId,
    (
      SELECT IFNULL(MAX(sortOrder), 0) + 1
      FROM queue
    ),
    $songId
  )
RETURNING *;

-- name: dequeueBySortOrder :one
UPDATE queue
SET played = TRUE
WHERE channelId = $channelId
  AND sortOrder = $sortOrder
RETURNING *;

-- name: dequeueNext :one
UPDATE queue
SET played = TRUE
WHERE sortOrder = (
    SELECT sortOrder
    FROM queue
    WHERE channelId = $channelId
      AND played = FALSE
    ORDER BY id ASC
    LIMIT 1
  )
RETURNING *;

-- name: listQueue :many
SELECT *
FROM queue
  INNER JOIN song ON queue.songId = song.songId
WHERE channelId = $channelId
  AND played = FALSE
ORDER BY sortOrder ASC
LIMIT $limit OFFSET $offset;

-- name: listChannels
SELECT DISTINCT channelId
FROM queue;

-- name: clearQueue :exec
DELETE FROM queue
WHERE channelId = $channelId;

-- name: insertQuery :one
INSERT
  OR REPLACE INTO query (query, songId)
VALUES ($query, $songId)
RETURNING *;

-- name: incrementQueryHits :one
UPDATE query
SET hits = hits + 1
WHERE query LIKE $query
RETURNING *;

-- name: matchQuery :one
SELECT *
FROM song
WHERE songId = (
    SELECT songId
    FROM query
    WHERE query LIKE $query
    LIMIT 1
  );

-- name: listQueriedSongs :many
SELECT *
FROM song
  INNER JOIN query ON query.songId = song.songId
ORDER BY hits DESC
LIMIT $limit OFFSET $offset;
