import { AudioPlayerStatus, VoiceConnection } from '@discordjs/voice';
import { Client, Message } from 'discord.js';

import { config } from './config';
import { Emoji, emojiGetter } from './emotes';
import { getVoiceConnectionFromMessage, initializeVoiceConnectionFromMessage, messageAuthorVoiceChannel } from './lib/Audio';
import { player, playNext } from './lib/Player';
import { linkQueueItem, queue } from './lib/Queue';
import { logEvent, logMessage } from './lib/utils';
import { youtube } from './lib/Youtube';

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

  connection.subscribe(player);
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

  const [ command, ...args ] = content.split(/\s{1,}/g);
  const allArgs = args.join(' ').trim();
  switch (command) {
    case 'ping': {
      await message.channel.send ('pong');
      return;
    }

    case 'gtfo': {
      const emoji = emojiGetter(client.emojis.cache);
      await message.react(emoji(Emoji.FeelsCarlosMan));
      await client.user?.setStatus('invisible');
      cancel('requested disconnect');

      return;
    }

    case 'summon': {
      // TODO throttle?
      await voiceCommand(message, true, true, async () => {
        await message.react(emoji(Emoji.peepoHappy));
      });

      return;
    }

    case 'play': {
      // TODO throttle
      await voiceCommand(message, true, true, async () => {
        if (args.length < 1 && player.state.status === AudioPlayerStatus.Paused) {
          player.unpause();
          return;
        }

        const result = await youtube.query(allArgs);
        if (!result) {
          await message.channel.send('No results found');
          return;
        }

        const { videoId } = result.id;
        logEvent('enqueue', { videoId });
      });

      break;
    }

    case 'np': {
      if (queue.current) {
        await message.channel.send(`Now playing: ${linkQueueItem(queue.current)}`);
      } else {
        await message.channel.send('Not playing anything');
      }

      return;
    }

    case 'queue': {
      if (queue.length < 1) {
        await message.channel.send('Nothing queued');
        return;
      }

      await message.channel.send([
        'Queued items',
        ...queue.map((item, i) => `${i}. ${linkQueueItem(item)}`),
      ].join('\n'));

      return;
    }

    case 'stop': {
      await voiceCommand(message, true, false, async () => {
        player.stop();
      });

      return;
    }

    case 'pause': {
      // TODO throttle?
      await voiceCommand(message, true, false, async () => {
        switch(player.state.status) {
          case AudioPlayerStatus.Paused:
            player.unpause();
            return;

          case AudioPlayerStatus.Playing:
            player.pause(true);
            return;
        }
      });

      return;
    }

    case 'skip': {
      // TODO throttle?
      await voiceCommand(message, true, false, async () => {
        player.stop();
        playNext();
      });

      return;
    }
  }
};
