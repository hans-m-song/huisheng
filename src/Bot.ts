import { Client, Intents, Message } from 'discord.js';

import { messageHandler } from './commands';
import { config } from './config';
import { Emoji, emojiGetter } from './emotes';
import { logError, logEvent } from './utils';

const isBotCommand = ({ author, content }: Message) =>
  !author.bot && content.startsWith(config.botPrefix) ? content.slice(1) : null;

export const initializeClient = async () => {
  const client = new Client<true>({
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

  client.on('error', (error) => logError('client', error));
  client.on('messageCreate', messageHandler(client));

  const ready = new Promise<void>((resolve) => {
    client.once('ready', (client) => {
      logEvent('ready', `@${client.user.tag}, invite: ${config.authorizeUrl}`);
      client.user.setPresence({
        activities: [ { name: 'slaving away' } ],
        status:     'online',
      });
      resolve();
    });
  });

  await Promise.all([ client.login(config.botToken), ready ]);

  return { client, reason: exitPromise(client) };
};

const exitPromise = (client: Client<true>) =>
  new Promise<string>((resolve) => {
    process.once('SIGINT', () => {
      resolve('caught sigint');
    });

    client.once('invalidated', () => {
      resolve('session invalidated');
    });

    client.on('messageCreate', async (message) => {
      if (isBotCommand(message) !== 'gtfo') {
        return;
      }

      const emoji = emojiGetter(client.emojis.cache);
      await message.react(emoji(Emoji.FeelsCarlosMan));
      await client.user.setStatus('invisible');
      resolve('requested disconnect');
    });
  });
