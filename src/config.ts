import { numEnv } from './lib/utils';

const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const botToken = process.env.DISCORD_BOT_TOKEN ?? '';
const botPrefix = process.env.DISCORD_BOT_PREFIX ?? '!';
const youtubeBaseUrl = process.env.YOUTUBE_BASE_URL ?? 'https://www.googleapis.com/youtube/v3';
const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? '';
const youtubeDLCacheDir = process.env.YOUTUBE_DL_CACHE_DIR ?? '/tmp/cache';
const youtubeDLRetries = numEnv(process.env.YOUTUBE_DL_RETRIES, { default: 3 , min: 1 });
const MS_IN_ONE_HOUR = 1000 * 60 * 60;
const MS_IN_THREE_DAYS = MS_IN_ONE_HOUR * 24 * 3;
const MS_IN_ONE_WEEK = MS_IN_ONE_HOUR * 24 * 7;
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

  // Youtube
  youtubeBaseUrl,
  youtubeApiKey,
  youtubeDLRetries,
  youtubeDLCacheDir,
  youtubeDLCacheTTL,
};

console.log(
  'config',
  {
    botPrefix,
    youtubeBaseUrl,
    youtubeDLRetries,
    youtubeDLCacheDir,
    youtubeDLCacheTTL,
  }
);
