import { Client, Intents, Message } from 'discord.js';

import { config } from './config';
import { Emoji, emojiGetter as emojiGetter } from './emotes';
import { logEvent, logMessage } from './utils';

const isBotCommand = ({ author, content }: Message) =>
  !author.bot && content.startsWith(config.botPrefix) ? content.slice(1) : null;

const respond = (
  message: Message,
  ...content: Parameters<typeof message.channel.send>
) => message.channel.send(...content);

export const initialize = async () => {
  const client = new Client({
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

  client.once('ready', (client) => {
    logEvent('ready', `@${client.user.tag}, invite: ${config.authorizeUrl}`);
    client.user.setPresence({
      activities: [ { name: 'slaving away' } ],
      status:     'online',
    });
  });

  registerMessageCommands(client);

  await client.login(config.botToken);

  return { client, promise: exitPromise(client) };
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
        await respond (message, 'pong');
        await respond(message, emoji(Emoji.FeelsCarlosMan));
        console.log(emoji?.toString() );
        break;
      }
    }
  });
};

const exitPromise = (client: Client) =>
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
      await client.user?.setStatus('invisible');
      resolve('requested disconnect');
    });
  });
