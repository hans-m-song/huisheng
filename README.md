# huisheng

Quick and dirty Discord bot to play youtube videos. Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) under the hood.

## Usage

### Commands

Replace `!` with your configured prefix

- `!ping` - respond with "pong"
- `!gtfo` - leave the voice channel and terminate
- `!summon` - join your current voice channel
- `!play [query]` - join your current voice channel and attempt to search on youtube for your query, can also specify a url
- `!clear` - clears playlist
- `!remove index` - remove an item from the playlist at position `index`
- `!np` - respond with currently playing song
- `!queue` - respond with songs queued (currently doesn't work)
- `!stop` - stop currently playing song
- `!pause` - pause or resume currently playing song
- `!skip` - play next song in the queue

## Deploying

### Directly

Requirements:

- Python
- Node.js v16
- yt-dlp
- ffmpeg

```bash
npm install --global yarn
yarn install
yarn compile
node dist/index.js
```

### With docker

```bash
docker run -d \
  -e DISCORD_CLIENT_ID=required
  -e DISCORD_BOT_TOKEN=required
  -e YOUTUBE_API_KEY=required
  -v some-volume-or-path:/var/lib/huisheng/cache # optionally persist your cache somewhere
  public.ecr.aws/t4g8t3e5/huisheng
```

### With docker-compose

Refer to the `docker-compose.yml` file within this repo for an example.

```bash
docker-compose up -d --build
```

## Configuration

Set these values in your environment:

These values are required:

- `DISCORD_CLIENT_ID` - Discord App client id (make one [here](https://discord.com/developers/applications)), a good guide [here](https://discordjs.guide/preparations/setting-up-a-bot-application.html).
- `DISCORD_BOT_TOKEN` - Token for the bot associated with the app.
- `YOUTUBE_API_KEY` - Youtube API developer key.

These values are optional:

- `DISCORD_BOT_PREFIX` - Character to prefix commands with (default: `!`)
- `CACHE_DIR` - Path to a cache directory (default: `/var/lib/huisheng/cache`)
- `YOUTUBE_BASE_URL` - Youtube API base url (default: `https://www.googleapis.com/youtube/v3`)
- `YOUTUBE_DL_EXECUTABLE` - Executable for yt-dlp, can use a relative or absolute path as well, e.g. `./my-yt-dlp` (default: `yt-dlp`)
- `YOUTUBE_DL_MAX_CONCURRENCY` - Maximum number of concurrent downloads (default: `1`)
- `YOUTUBE_DL_RETRIES` - Number of times to retry a download (default: `3`)
- `YOUTUBE_DL_CACHE_TTL` - Time to invalidate download cache (currently doesn't work)
- `MONGO_USER`, `MONGO_PASS`, `MONGO_HOST`, `MONGO_PORT` - MongoDB connection parameters, (default: `mongo`, `mongo`, `mongo`, `27017`)
- `MONGO_DB_NAME` - Name of database within MongoDB (default: `huisheng`)
