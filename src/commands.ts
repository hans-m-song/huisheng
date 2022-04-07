import { VoiceConnection } from '@discordjs/voice';
import { Client, Message } from 'discord.js';

import { getVoiceConnectionFromMessage, initializeVoiceConnectionFromMessage, messageAuthorVoiceChannel } from './Audio';
import { config } from './config';
import { Emoji, emojiGetter } from './emotes';
import { logMessage } from './utils';

const botCommand = (message: Message): string | null =>
  !message.author.bot && message.content.startsWith(config.botPrefix)
    ? message.content.slice(1)
    : null;

const voiceCommand = async (
  message: Message,
  checkAuthorChannel: boolean,
  allowConnect: boolean,
  callback: (connection: VoiceConnection) => Promise<void>
): Promise<void> => {
  if (checkAuthorChannel && !messageAuthorVoiceChannel(message)) {
    await message.channel.send('must be in a voice channel');
    return;
  }

  const existing = getVoiceConnectionFromMessage(message);
  if (!existing && !allowConnect) {
    return;
  }

  const connection = existing ?? await initializeVoiceConnectionFromMessage(message);
  if (!connection) {
    return;
  }

  await callback(connection);
};

type Cancel = (reason: string) => void

export const messageHandler = (client: Client, cancel: Cancel) => async (message: Message) => {
  const content = botCommand(message);
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

    case 'gtfo': {
      const emoji = emojiGetter(client.emojis.cache);
      await message.react(emoji(Emoji.FeelsCarlosMan));
      await client.user?.setStatus('invisible');
      cancel('requested disconnect');

      break;
    }

    case 'summon': {
      await voiceCommand(message, true, true, async () => {
        await message.react(emoji(Emoji.peepoHappy));
      });

      break;
    }

    case 'play':
    case 'queue':
    case 'stop':
    case 'pause':
    case 'skip':
  }
};
