import { AudioPlayerStatus, createAudioResource, demuxProbe } from '@discordjs/voice';
import { Client, Message, MessageEmbed } from 'discord.js';
import { createReadStream } from 'fs';

import { config } from './config';
import { emojiGetter, emojis } from './emotes';
import { voiceCommand } from './lib/Audio';
import { cache } from './lib/AudioCache';
import { AudioFile } from './lib/AudioFile';
import { logEvent, logMessage } from './lib/utils';
import { youtube } from './lib/Youtube';

const botCommand = (message: Message): string | null =>
  !message.author.bot && message.content.startsWith(config.botPrefix)
    ? message.content.slice(1)
    : null;

export const messageHandler = (client: Client) => async (message: Message) => {
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
      await voiceCommand(message, false, async (player) => {
        player.instance.pause();
        await message.react(emoji(emojis.FeelsCarlosMan));
        await message.member?.voice.disconnect();
      });
      return;
    }

    case 'summon': {
      // TODO throttle?
      await voiceCommand(message, true, async () => {
        await message.react(emoji(emojis.peepoHappy));
      });
      return;
    }

    case 'play': {
      // TODO throttle
      await voiceCommand(message, true, async (player) => {
        if (args.length < 1 && player.instance.state.status === AudioPlayerStatus.Paused) {
          player.instance.unpause();
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
          await message.react('❌');
          await message.channel.send({ embeds: [ embed ] });
          return;
        }

        file.title ??= title;
        file.uploader ??= channelTitle;

        const { stream, type } = await demuxProbe(createReadStream(file.filepath));
        const resource = createAudioResource(stream, { inputType: type, metadata: file });
        logEvent('enqueue', { videoId, path: file.filepath });
        player.playlist.enqueue(resource);

        const embed = file.toEmbed().setDescription('Enqueued');
        await message.channel.send({ embeds: [ embed ] });

        if (!player.playlist.current) {
          player.next();
        }
      });
      return;
    }

    case 'np': {
      await voiceCommand(message, false, async (player) => {
        if (player.playlist.current) {
          const embed = player.playlist.current.metadata.toEmbed()
            .setDescription('Now playing');
          await message.channel.send({ embeds: [ embed ] });
          return;
        }

        await message.channel.send('Not playing anything');
      });
      return;
    }

    case 'queue': {
      await voiceCommand(message, false, async (player) => {
        if (player.playlist.length < 1) {
          await message.channel.send('Nothing queued');
          return;
        }

        const embed = new MessageEmbed()
          .setTitle('Queued items')
          .setDescription( player.playlist.map((item, i) =>
            `${i}. ${item.metadata.toLink()}`).join('\n') );
        await message.channel.send({ embeds: [ embed ] });
      });
      return;
    }

    case 'stop': {
      await voiceCommand(message, false, (player) => {
        player.instance.stop();
      });
      return;
    }

    case 'pause': {
      // TODO throttle?
      await voiceCommand(message, false, (player) => {
        player.playPause();
      });
      return;
    }

    case 'skip': {
      // TODO throttle?
      await voiceCommand(message, false, (player) => {
        player.instance.stop();
        player.next();
      });
      return;
    }
  }
};
