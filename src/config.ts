import { numEnv } from './lib/utils';

const MS_IN_ONE_HOUR = 1000 * 60 * 60;
const MS_IN_THREE_DAYS = MS_IN_ONE_HOUR * 24 * 3;
const MS_IN_ONE_WEEK = MS_IN_ONE_HOUR * 24 * 7;

const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const botToken = process.env.DISCORD_BOT_TOKEN ?? '';
const botPrefix = process.env.DISCORD_BOT_PREFIX ?? '!';
const cacheDir = process.env.YOUTUBE_DL_CACHE_DIR ?? '/var/lib/huisheng/cache';
const youtubeBaseUrl = process.env.YOUTUBE_BASE_URL ?? 'https://www.googleapis.com/youtube/v3';
const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? '';
const youtubeDLExecutable = process.env.YOUTUBE_DL_EXECUTABLE ?? 'yt-dlp';
const youtubeDLRetries = numEnv(process.env.YOUTUBE_DL_RETRIES, { default: 3 , min: 1, max: 5 });
const youtubeDLCacheTTL = numEnv(process.env.YOUTUBE_DL_CACHE_TTL, { default: MS_IN_THREE_DAYS, min: MS_IN_THREE_DAYS , max: MS_IN_ONE_WEEK });

if (!clientId) {
  throw new Error('Discord client id must be set in "DISCORD_CLIENT_ID"');
}

if (!botToken) {
  throw new Error('Discord bot token must be set in "DISCORD_BOT_TOKEN"');
}

if (!youtubeApiKey) {
  throw new Error('Youtube api key must be set in "YOUTUBE_API_KEY"');
}

export const config = {
  // Bot
  clientId,
  botToken,
  botPrefix,
  cacheDir,

  // Youtube
  youtubeBaseUrl,
  youtubeApiKey,
  youtubeDLExecutable,
  youtubeDLRetries,
  youtubeDLCacheTTL,
};

console.log(
  'config',
  {
    botPrefix,
    cacheDir,
    youtubeBaseUrl,
    youtubeDLExecutable,
    youtubeDLRetries,
    youtubeDLCacheTTL,
  }
);
