const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const botToken = process.env.DISCORD_BOT_TOKEN ?? '';
const botPrefix = process.env.DISCORD_BOT_PREFIX ?? '!';
const serverId = process.env.DISCORD_SERVER_ID ?? '';
const modRoleId = process.env.DISCORD_ROLE_ID_MODS ?? '';
const authorizeUrl =
  'https://discord.com/api/oauth2/authorize?' +
  [
    `client_id=${clientId}`,
    `permissions=${process.env.DISCORD_BOT_PERMISSIONS ?? '3148864'}`,
    'scope=applications.commands%20bot',
  ].join('&');

if (!botToken) {
  throw new Error('Discord bot token must be set in "DISCORD_BOT_TOKEN"');
}

if (!clientId) {
  throw new Error('Discord client id must be set in "DISCORD_CLIENT_ID"');
}

if (!serverId) {
  throw new Error('Discord server id must be set in "DISCORD_SERVER_ID"');
}

if (!modRoleId) {
  throw new Error('Discord mod role id must be set in "DISCORD_ROLE_ID_MODS"');
}

export const config = {
  // bot
  clientId,
  botToken,
  botPrefix,

  // server
  serverId,
  modRoleId,
  authorizeUrl,
};
