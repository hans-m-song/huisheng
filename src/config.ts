import 'dotenv/config';

import { assertEnv, numEnv } from './lib/utils';

const githubSha = process.env.GITHUB_SHA ?? 'unknown';
const clientId = assertEnv('DISCORD_CLIENT_ID');
const botToken = assertEnv('DISCORD_BOT_TOKEN');
const botPrefix = process.env.DISCORD_BOT_PREFIX ?? '!';
const cacheDir = process.env.CACHE_DIR ?? '/var/lib/huisheng/cache';
const youtubeBaseUrl = process.env.YOUTUBE_BASE_URL ?? 'https://www.googleapis.com/youtube/v3';
const youtubeApiKey = assertEnv('YOUTUBE_API_KEY');
const youtubeDLExecutable = process.env.YOUTUBE_DL_EXECUTABLE ?? 'yt-dlp';
const youtubeDLMaxConcurrency = numEnv(process.env.YOUTUBE_DL_MAX_CONCURRENCY, {
  default: 1,
  min: 1,
  max: 5,
});
const youtubeDLRetries = numEnv(process.env.YOUTUBE_DL_RETRIES, {
  default: 3,
  min: 1,
  max: 5,
});
const minioEndpoint = process.env.MINIO_ENDPOINT ?? '';
const minioBucketName = process.env.MINIO_BUCKET_NAME ?? 'huisheng';
const minioAccessKey = process.env.MINIO_ACCESS_KEY ?? '';
const minioSecretKey = process.env.MINIO_SECRET_KEY ?? '';

if (!clientId) {
  throw new Error('Discord client id must be set in "DISCORD_CLIENT_ID"');
}

if (!botToken) {
  throw new Error('Discord bot token must be set in "DISCORD_BOT_TOKEN"');
}

if (!youtubeApiKey) {
  throw new Error('Youtube api key must be set in "YOUTUBE_API_KEY"');
}

const minioAccessKeyObscured =
  minioAccessKey.slice(0, 4) + minioAccessKey.slice(4).replace(/./g, '*');

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

  // minio
  minioEndpoint,
  minioBucketName,
  minioAccessKey,
  minioAccessKeyObscured,
  minioSecretKey,
};

console.log('config', {
  githubSha,
  botPrefix,
  cacheDir,
  youtubeBaseUrl,
  youtubeDLExecutable,
  youtubeDLMaxConcurrency,
  youtubeDLRetries,
  minioEndpoint,
  minioBucketName,
  minioAccessKey: minioAccessKeyObscured,
});
