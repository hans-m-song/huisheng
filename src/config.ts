import { assertEnv, boolEnv, numEnv, obscure } from './lib/utils';

const debug = process.env.DEBUG == 'true';
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
  debug,
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

console.log('config', {
  githubSha,
  botPrefix,
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
