const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const botToken = process.env.DISCORD_BOT_TOKEN ?? '';
const botPrefix = process.env.DISCORD_BOT_PREFIX ?? '!';
const authorizeUrl
  = 'https://discord.com/api/oauth2/authorize?'
  + [
    `client_id=${clientId}`,
    `permissions=${process.env.DISCORD_BOT_PERMISSIONS ?? '3148864'}`,
    'scope=applications.commands%20bot',
  ].join('&');
const youtubeBaseUrl = process.env.YOUTUBE_BASE_URL ?? 'https://www.googleapis.com/youtube/v3';
const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? '';

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
  authorizeUrl,

  // Youtube
  youtubeBaseUrl,
  youtubeApiKey,
};
