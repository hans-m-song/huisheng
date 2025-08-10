import pino from 'pino';

import axios from 'axios';
import z from 'zod';

const bool = (defaultValue: 'true' | 'false' = 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((val) => val === 'true');

export const config = z
  .object({
    CACHE_DIR: z.string().default('/var/lib/huisheng/cache'),
    DISCORD_BOT_PREFIX: z.string().default('!'),
    DISCORD_BOT_TOKEN: z.string(),
    DISCORD_CLIENT_ID: z.string(),
    GITHUB_SHA: z.string().default('unknown'),
    LOG_FORMAT: z.enum(['text', 'json']).default('json'),
    LOG_LEVEL: z.enum(Object.keys(pino.levels.values)).default('info'),
    OTLP_METRICS_ENDPOINT: z.string().default('http://localhost:4138/v1/metrics'),
    OTLP_METRICS_TOKEN: z.string().optional(),
    OTLP_TRACES_ENDPOINT: z.string().default('http://localhost:4138/v1/traces'),
    OTLP_TRACES_TOKEN: z.string().optional(),
    S3_ACCESS_KEY: z.string(),
    S3_BUCKET_NAME: z.string().default('huisheng'),
    S3_ENDPOINT_PORT: z.coerce.number().default(9000),
    S3_ENDPOINT_SSL: bool(),
    S3_ENDPOINT: z.string().default('localhost'),
    S3_SECRET_KEY: z.string(),
    SPOTIFY_BASE_URL: z.string().default('https://api.spotify.com/v1'),
    SPOTIFY_CLIENT_ID: z.string().optional(),
    SPOTIFY_CLIENT_SECRET: z.string().optional(),
    YOUTUBE_API_KEY: z.string(),
    YOUTUBE_BASE_URL: z.string().default('https://www.googleapis.com/youtube/v3'),
    YTDL_EXECUTABLE: z.string().default('yt-dlp'),
    YTDL_MAX_CONCURRENCY: z.coerce.number().min(1).max(5).default(1),
    YTDL_RETRIES: z.coerce.number().min(1).max(5).default(3),
    YTDLP_POT_PROVIDER_ENABLED: bool(),
    YTDLP_POT_PROVIDER: z.string().default('http://localhost:4166'),
  })
  .parse(process.env);

export type Config = typeof config;

const redactions = [
  'accessToken',
  'Api-Key',
  'Authorization',

  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'OTLP_METRICS_TOKEN',
  'OTLP_TRACES_TOKEN',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'YOUTUBE_API_KEY',
];

export const log = pino({
  transport:
    config.LOG_FORMAT == 'text'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  level: config.LOG_LEVEL,
  formatters: {
    level: (label, _number) => ({ level: label }),
  },

  serializers: {
    config: (value: any): any => {
      const raw = JSON.stringify(value);
      return JSON.parse(raw, (key, value) => {
        if (redactions.includes(key) && typeof value === 'string') {
          return 'REDACTED';
        }
        return value;
      });
    },
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
