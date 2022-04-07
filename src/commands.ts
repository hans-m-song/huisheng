import { Client, Message } from 'discord.js';

import { initializeVoiceConnection } from './Audio';
import { config } from './config';
import { Emoji, emojiGetter } from './emotes';
import { logMessage } from './utils';

const isBotCommand = ({ author, content }: Message) =>
  !author.bot && content.startsWith(config.botPrefix) ? content.slice(1) : null;

export const messageHandler = (client: Client) => async (message: Message) => {
  const content = isBotCommand(message);
  if (!content) {
    return;
  }

  logMessage(message);
  const emoji = emojiGetter(client.emojis.cache);

  switch (content) {
    case 'ping': {
      await message.channel.send ('pong');
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
};
