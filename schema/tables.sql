CREATE TABLE song (
  songId TEXT NOT NULL PRIMARY KEY,
  songTitle TEXT NOT NULL,
  songUrl TEXT NOT NULL,
  artistId TEXT NULL,
  artistTitle TEXT NULL,
  artistUrl TEXT NULL,
  thumbnail TEXT NULL,
  duration INTEGER NULL,
  cachedAt INTEGER NOT NULL DEFAULT (unixepoch('now'))
);

CREATE TABLE queue (
  channelId TEXT NOT NULL,
  sortOrder INTEGER NOT NULL,
  songId TEXT NOT NULL REFERENCES song (songId) ON UPDATE CASCADE ON DELETE CASCADE,
  played boolean NOT NULL DEFAULT false,
  PRIMARY KEY (channelId, sortOrder)
);
