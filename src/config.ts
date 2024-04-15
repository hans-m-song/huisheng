import axios from 'axios';
import pino from 'pino';

import { assertEnv, boolEnv, enumEnv, numEnv, obscure } from './lib/utils';

const githubSha = process.env.GITHUB_SHA ?? 'unknown';
const logLevel = enumEnv(Object.keys(pino.levels.values))('LOG_LEVEL', 'info');
const logFormat = enumEnv(['text', 'json'])('LOG_FORMAT', 'json');

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

const minioEndpoint = process.env.MINIO_ENDPOINT ?? 'api.minio.k8s.axatol.xyz';
const minioEndpointPort = numEnv(process.env.MINIO_ENDPOINT_PORT, { default: 443 });
const minioEndpointSSL = boolEnv(process.env.MINIO_ENDPOINT_SSL, true);
const minioBucketName = process.env.MINIO_BUCKET_NAME ?? 'huisheng';
const minioAccessKey = assertEnv('MINIO_ACCESS_KEY');
const minioSecretKey = assertEnv('MINIO_SECRET_KEY');

const spotifyBaseUrl = process.env.SPOTIFY_BASE_URL ?? 'https://api.spotify.com/v1';
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

export const config = {
  githubSha,
  logLevel,
  logFormat,

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
  minioEndpointPort,
  minioEndpointSSL,
  minioBucketName,
  minioAccessKey,
  minioSecretKey,

  // Spotify
  spotifyBaseUrl,
  spotifyClientId,
  spotifyClientSecret,
};

export const log = pino({
  transport:
    config.logFormat == 'text' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  level: config.logLevel,
  serializers: {
    error: (error: any): any => {
      if (
        typeof error === 'string' ||
        typeof error === 'number' ||
        typeof error === 'undefined' ||
        error === null
      ) {
        return error;
      }

      const raw = axios.isAxiosError(error)
        ? JSON.stringify(error.toJSON())
        : JSON.stringify(error, Object.getOwnPropertyNames(error));

      return JSON.parse(raw, (key, value) => {
        const redactions = ['Authorization', 'Api-Key', 'accessToken'];
        if (redactions.includes(key) && typeof value === 'string') {
          return 'REDACTED';
        }

        if (key === 'stack' && typeof value === 'string') {
          return value.split(/\n\s*/g);
        }

        return value;
      });
    },
  },
});

log.debug('config', {
  githubSha,
  botPrefix,
  logLevel,
  logFormat,
  cacheDir,
  youtubeBaseUrl,
  youtubeDLExecutable,
  youtubeDLMaxConcurrency,
  youtubeDLRetries,
  minioEndpoint,
  minioEndpointPort,
  minioEndpointSSL,
  minioBucketName,
  spotifyBaseUrl,
  minioAccessKey: obscure(minioAccessKey),
  spotifyClientId: obscure(spotifyClientId ?? ''),
});
