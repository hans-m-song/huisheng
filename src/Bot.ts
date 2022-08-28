import { ActivityType, Client, GatewayIntentBits, Partials } from 'discord.js';

import { config } from './config';
import {
  onMessageCreate,
  onInteractionCreate,
  onError,
  onInvalidated,
  onVoiceStateUpdate,
} from './events';
import { createCancellablePromise, logEvent } from './lib/utils';

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
    partials: [Partials.Channel],
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

  const { promise: reason } = exitPromise(client);
  client.on('error', onError);
  client.on('invalidated', onInvalidated);
  client.on('messageCreate', onMessageCreate(client));
  client.on('interactionCreate', onInteractionCreate(client));
  client.on('voiceStateUpdate', onVoiceStateUpdate(client));

  const ready = new Promise<void>((resolve) => {
    client.once('ready', (client) => {
      logEvent('ready', `@${client.user.tag}, invite: ${authorizeUrl}`);
      client.user.setPresence({
        status: 'online',
        activities: [{ type: ActivityType.Watching, name: 'Shrek 2' }],
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
