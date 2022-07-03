import { Client, Intents } from 'discord.js';

import { config } from './config';
import { createCancellablePromise, logError, logEvent } from './lib/utils';
import { messageHandler } from './messageHandler';
import { voiceStateHandler } from './voiceStateHandler';

const authorizeUrl =
  'https://discord.com/api/oauth2/authorize?' +
  [
    `client_id=${config.clientId}`,
    `permissions=${process.env.DISCORD_BOT_PERMISSIONS ?? '3148864'}`,
    `scope=${encodeURIComponent(['applications.commands', 'bot'].join('&'))}`,
  ].join('&');

export const initializeClient = async () => {
  const client = new Client({
    // Required for direct messages
    partials: ['CHANNEL'],
    intents: [
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_VOICE_STATES,
    ],
  });

  const { promise: reason } = exitPromise(client);
  client.on('error', (error) => logError('client', error));
  client.on('messageCreate', messageHandler(client));
  client.on('voiceStateUpdate', voiceStateHandler(client));

  const ready = new Promise<void>((resolve) => {
    client.once('ready', (client) => {
      logEvent('ready', `@${client.user.tag}, invite: ${authorizeUrl}`);
      client.user.setPresence({
        status: 'online',
        activities: [{ type: 'WATCHING', name: 'Shrek 2' }],
      });
      resolve();
    });
  });

  await Promise.all([client.login(config.botToken), ready]);

  return { client, reason };
};

const exitPromise = (client: Client<true>) =>
  createCancellablePromise<string>((resolve) => {
    process.once('SIGINT', () => resolve('caught sigint'));
    process.once('SIGTERM', () => resolve('caught sigterm'));
    client.once('invalidated', () => resolve('session invalidated'));
  });
