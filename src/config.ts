import 'dotenv/config';

import { numEnv } from './lib/utils';

const MS_IN_ONE_HOUR = 1000 * 60 * 60;
const MS_IN_THREE_DAYS = MS_IN_ONE_HOUR * 24 * 3;
const MS_IN_ONE_WEEK = MS_IN_ONE_HOUR * 24 * 7;

const githubSha = process.env.GITHUB_SHA ?? 'unknown';
const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const botToken = process.env.DISCORD_BOT_TOKEN ?? '';
const botPrefix = process.env.DISCORD_BOT_PREFIX ?? '!';
const cacheDir = process.env.CACHE_DIR ?? '/var/lib/huisheng/cache';
const youtubeBaseUrl = process.env.YOUTUBE_BASE_URL ?? 'https://www.googleapis.com/youtube/v3';
const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? '';
const youtubeDLExecutable = process.env.YOUTUBE_DL_EXECUTABLE ?? 'yt-dlp';
const youtubeDLMaxConcurrency = numEnv(process.env.YOUTUBE_DL_MAX_CONCURRENCY, { default: 1, min: 1, max: 5 });
const youtubeDLRetries = numEnv(process.env.YOUTUBE_DL_RETRIES, { default: 3 , min: 1, max: 5 });
const youtubeDLCacheTTL = numEnv(process.env.YOUTUBE_DL_CACHE_TTL, { default: MS_IN_THREE_DAYS, min: MS_IN_THREE_DAYS , max: MS_IN_ONE_WEEK });
const mongoWaitFor = (process.env.MONGO_WAIT_FOR ?? 'false') === 'true';
const mongoUser = process.env.MONGO_USER ?? 'mongo';
const mongoPass = process.env.MONGO_PASS ?? 'mongo';
const mongoHost = process.env.MONGO_HOST ?? 'mongo';
const mongoPort = process.env.MONGO_PORT ?? '27017';
const mongoDbName = process.env.MONGO_DB_NAME ?? 'huisheng';

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
  githubSha,

  // Bot
  clientId,
  botToken,
  botPrefix,
  cacheDir,

  // Youtube
  youtubeBaseUrl,
  youtubeApiKey,
  youtubeDLExecutable,
  youtubeDLMaxConcurrency,
  youtubeDLRetries,
  youtubeDLCacheTTL,

  // mongo
  mongoWaitFor,
  mongoUser,
  mongoPass,
  mongoPassObscured: mongoPass.replace(/./g, '*'),
  mongoHost,
  mongoPort,
  mongoDbName,
};

console.log(
  'config',
  {
    githubSha,
    botPrefix,
    cacheDir,
    youtubeBaseUrl,
    youtubeDLExecutable,
    youtubeDLMaxConcurrency,
    youtubeDLRetries,
    youtubeDLCacheTTL,
    mongoWaitFor,
    mongoUser,
    mongoPass: config.mongoPassObscured,
    mongoHost,
    mongoPort,
    mongoDbName,
  }
);
