import { AudioPlayerStatus, createAudioResource, demuxProbe, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { Client, Message, MessageEmbed } from 'discord.js';
import { createReadStream } from 'fs';

import { config } from './config';
import { emojiGetter, emojis } from './emotes';
import { getVoiceConnectionFromMessage, initializeVoiceConnectionFromMessage, messageAuthorVoiceChannel } from './lib/Audio';
import { cache } from './lib/AudioCache';
import { AudioFile } from './lib/AudioFile';
import { player, playNext, playlist, playPause } from './lib/Player';
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
  callback: (connection: VoiceConnection) => Promise<void> | void
): Promise<void> => {
  if (checkAuthorChannel && !messageAuthorVoiceChannel(message)) {
    await message.channel.send('Must be in a voice channel');
    return;
  }

  const existing = getVoiceConnectionFromMessage(message);
  if (!existing && !allowConnect) {
    logEvent('voiceCommand', 'not executing', { reason: 'no existing connection and not allowed to connect' });
    return;
  }

  const connection = existing ?? await initializeVoiceConnectionFromMessage(message);
  if (!connection) {
    logEvent('voiceCommand', 'not executing', { reason: 'could not establish connection' });
    return;
  }

  if (connection.state.status !== VoiceConnectionStatus.Destroyed && !connection.state.subscription) {
    logEvent('voiceCommand', 'subscribing to player');
    connection.subscribe(player);
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

  const [ command, ...args ] = content.split(/\s{1,}/g);
  const allArgs = args.join(' ').trim();
  switch (command) {
    case 'ping': {
      await message.channel.send ('pong');
      return;
    }

    case 'gtfo': {
      await message.react(emoji(emojis.FeelsCarlosMan));
      await client.user?.setStatus('invisible');
      cancel('requested disconnect');

      return;
    }

    case 'summon': {
      // TODO throttle?
      await voiceCommand(message, true, true, async () => {
        await message.react(emoji(emojis.peepoHappy));
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

        const { videoId, channelTitle, title } = result;
        const url = `https://youtube.com/watch?v=${videoId}`;

        const file = await cache.load(videoId) ?? await AudioFile.fromUrl(url);
        if (!file) {
          const embed = new MessageEmbed().setTitle('Failed to load').setURL(url);
          await Promise.all([
            message.react('❌'),
            message.channel.send({ embeds: [ embed ] }),
          ]);
          return;
        }

        console.log(file);
        file.title ??= title;
        file.uploader ??= channelTitle;

        const { stream, type } = await demuxProbe(createReadStream(file.filepath));
        const resource = createAudioResource(stream, { inputType: type, metadata: file });
        logEvent('enqueue', { videoId, path: file.filepath });
        playlist.enqueue(resource);

        const embed = file.toEmbed().setTitle(`Enqueued - ${file.title ?? 'Unknown'}`);
        await message.channel.send({ embeds: [ embed ] });

        if (!playlist.current) {
          playNext();
        }
      });

      break;
    }

    case 'np': {
      if (playlist.current) {
        await message.channel.send(`Now playing: ${playlist.current.metadata.toLink()}`);
        return;
      }

      await message.channel.send('Not playing anything');

      return;
    }

    case 'queue': {
      if (playlist.length < 1) {
        await message.channel.send('Nothing queued');
        return;
      }

      const embed = new MessageEmbed()
        .setTitle('Queued items')
        .setDescription( playlist.map((item, i) =>
          `${i}. ${item.metadata.toLink()}`).join('\n') );
      await message.channel.send({ embeds: [ embed ] });

      return;
    }

    case 'stop': {
      await voiceCommand(message, true, false, () => { player.stop(); });
      return;
    }

    case 'pause': {
      // TODO throttle?
      await voiceCommand(message, true, false, playPause);
      return;
    }

    case 'skip': {
      // TODO throttle?
      await voiceCommand(message, true, false, () => {
        player.stop();
        playNext();
      });

      return;
    }
  }
};
