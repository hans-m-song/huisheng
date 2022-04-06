import { Client, Intents, Message } from 'discord.js';

import { initializeVoiceConnection } from './Audio';
import { config } from './config';
import { Emoji, emojiGetter as emojiGetter } from './emotes';
import { logError, logEvent, logMessage } from './utils';

const isBotCommand = ({ author, content }: Message) =>
  !author.bot && content.startsWith(config.botPrefix) ? content.slice(1) : null;

export const initializeClient = async () => {
  const client = new Client<true>({
    // required for direct messages
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
  registerMessageCommands(client);

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

const registerMessageCommands = (client: Client) => {
  client.on('messageCreate', async (message) => {
    const content = isBotCommand(message);
    if (!content) {
      return;
    }

    logMessage(message);
    const emoji = emojiGetter(client.emojis.cache);

    switch (content) {
      case 'ping': {
        await message.channel.send ( 'pong');
        return;
      }

      case 'summon': {
        if (!message.guild) {
          await message.reply('must be in a server to summon');
          return;
        }

        await message.react(emoji(Emoji.peepoHappy));
        const user = message.guild.members.cache.get(message.author.id);
        if (!user?.voice.channel) {
          await message.reply('must be in a voice channel to summon');
          return;
        }

        await initializeVoiceConnection(user.voice.channel);
        break;
      }
    }
  });
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
