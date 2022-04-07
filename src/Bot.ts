import { Client, Intents } from 'discord.js';

import { messageHandler } from './commands';
import { config } from './config';
import { createCancellablePromise, logError, logEvent } from './utils';

export const initializeClient = async () => {
  const client = new Client({
    // Required for direct messages
    partials: [ 'CHANNEL' ],
    intents:  [
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
  });

  const { cancel, promise: reason } = exitPromise(client);
  client.on('error', (error) => logError('client', error));
  client.on('messageCreate', messageHandler(client, cancel));

  const ready = new Promise<void>((resolve) => {
    client.once('ready', (client) => {
      logEvent('ready', `@${client.user.tag}, invite: ${config.authorizeUrl}`);
      client.user.setPresence({
        status:     'online',
        activities: [ { type: 'WATCHING' , name: 'Gaining sentience' } ],
      });
      resolve();
    });
  });

  await Promise.all([ client.login(config.botToken), ready ]);

  return { client, reason };
};

const exitPromise = (client: Client<true>) =>
  createCancellablePromise<string>((resolve) => {
    process.once('SIGINT', () => {
      resolve('caught sigint');
    });

    client.once('invalidated', () => {
      resolve('session invalidated');
    });
  });
