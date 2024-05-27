import { FastifyRequest } from 'fastify';
import pino from 'pino';

import { assertEnv, boolEnv, enumEnv, numEnv, obscure, serialiseError } from './lib/utils';

export const config = {
  githubSha: process.env.GITHUB_SHA ?? 'unknown',
  logLevel: enumEnv(Object.keys(pino.levels.values))('LOG_LEVEL', 'info'),
  logFormat: enumEnv(['text', 'json'])('LOG_FORMAT', 'json'),

  // Bot
  clientId: assertEnv('DISCORD_CLIENT_ID'),
  botToken: assertEnv('DISCORD_BOT_TOKEN'),
  botPrefix: process.env.DISCORD_BOT_PREFIX ?? '!',

  cacheDir: process.env.CACHE_DIR ?? '/var/lib/huisheng/cache',
  cacheDatabaseUrl: process.env.CACHE_DATABASE_URL ?? ':memory:',
  cacheDatabaseAuthToken: process.env.CACHE_DATABASE_AUTH_TOKEN,

  // Youtube
  youtubeBaseUrl: process.env.YOUTUBE_BASE_URL ?? 'https://www.googleapis.com/youtube/v3',
  youtubeApiKey: assertEnv('YOUTUBE_API_KEY'),
  youtubeDLExecutable: process.env.YOUTUBE_DL_EXECUTABLE ?? 'yt-dlp',
  youtubeDLMaxConcurrency: numEnv('YOUTUBE_DL_MAX_CONCURRENCY', { default: 1, min: 1, max: 5 }),
  youtubeDLRetries: numEnv('YOUTUBE_DL_RETRIES', { default: 1, min: 1, max: 5 }),

  // Minio
  minioEndpoint: process.env.MINIO_ENDPOINT ?? 'api.minio.axatol.xyz',
  minioEndpointPort: numEnv('MINIO_ENDPOINT_PORT', { default: 443 }),
  minioEndpointSSL: boolEnv('MINIO_ENDPOINT_SSL', true),
  minioBucketName: process.env.MINIO_BUCKET_NAME ?? 'huisheng',
  minioAccessKey: assertEnv('MINIO_ACCESS_KEY'),
  minioSecretKey: assertEnv('MINIO_SECRET_KEY'),

  // Web
  webPort: numEnv('WEB_PORT', { default: 8000 }),

  // Spotify
  spotifyBaseUrl: process.env.SPOTIFY_BASE_URL ?? 'https://api.spotify.com/v1',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
};

export const log = pino({
  transport:
    config.logFormat == 'text' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  level: config.logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    error: serialiseError,
    err: serialiseError,
    req: (req: FastifyRequest) => ({
      method: req.method,
      url: req.url,
      hostname: req.hostname,
      htmx: req.headers['hx-request'] === 'true',
      body: req.body,
    }),
  },
  redact: {
    paths: [
      'accessToken',
      'clientId',
      'botToken',
      'youtubeApiKey',
      'minioAccessKey',
      'minioSecretKey',
      'spotifyClientId',
      'spotifyClientSecret',
    ],
    censor: (value) => obscure(value),
  },
});

log.debug(config);
