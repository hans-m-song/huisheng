import { AudioPlayerStatus, getVoiceConnections } from '@discordjs/voice';
import { Client, Message, MessageEmbed } from 'discord.js';

import { config } from './config';
import { emojiGetter, emojis } from './emotes';
import { voiceCommand } from './lib/Audio';
import { AudioFile } from './lib/AudioFile';
import { EnqueueResult } from './lib/Player';
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

  const [command, ...args] = content.split(/\s{1,}/g);
  const allArgs = args.join(' ').trim();
  switch (command) {
    case 'ping': {
      await message.channel.send('pong');
      return;
    }

    case 'gtfo': {
      await voiceCommand(message, { allowConnect: false }, async (player, connection) => {
        player.instance.pause();
        await message.react(emoji(emojis.FeelsCarlosMan));
        connection.disconnect();
      });
      return;
    }

    case 'summon': {
      // TODO throttle?
      await voiceCommand(message, { allowConnect: true }, async () => {
        await message.react(emoji(emojis.peepoHappy));
      });
      return;
    }

    case 'play': {
      // TODO throttle
      await voiceCommand(message, { allowConnect: true }, async (player) => {
        if (args.length < 1 && player.instance.state.status === AudioPlayerStatus.Paused) {
          player.instance.unpause();
          return;
        }

        const results = await youtube.query(allArgs);
        if (!results || results.length < 1) {
          await message.channel.send('No results found');
          return;
        }

        await message.react('🤔');
        const enqueueResult = await player.enqueue(results);
        await message.channel.send({
          embeds: [reportEnqueueResult(enqueueResult)],
        });
        if (enqueueResult.errors.length > 0) {
          await message.react('❌');
        }

        if (!player.playlist.current) {
          player.next();
        }
      });
      return;
    }

    case 'np': {
      await voiceCommand(message, { allowConnect: false }, async (player) => {
        if (player.playlist.current) {
          const embed = player.playlist.current.toEmbed().setDescription('Now playing');
          await message.channel.send({ embeds: [embed] });
          return;
        }

        await message.channel.send('Not playing anything');
      });
      return;
    }

    case 'queue': {
      await voiceCommand(message, { allowConnect: false }, async (player) => {
        // TODO remove debugging
        logEvent(
          'queue',
          player.playlist.map((item) => item.toShortJSON()),
        );

        await message.channel.send({ embeds: [player.getQueueEmbed()] });
      });
      return;
    }

    case 'stop': {
      await voiceCommand(message, { allowConnect: false }, (player) => {
        player.instance.stop();
      });
      return;
    }

    case 'pause': {
      // TODO throttle?
      await voiceCommand(message, { allowConnect: false }, (player) => {
        player.playPause();
      });
      return;
    }

    case 'skip': {
      // TODO throttle?
      await voiceCommand(message, { allowConnect: false }, (player) => {
        player.instance.stop();
        player.next();
      });
      return;
    }

    case 'debug': {
      const connections = Array.from(getVoiceConnections().entries());
      const connectionsStatus =
        connections.length < 1
          ? 'none'
          : connections.map(([id, conn]) => `${id}: \`${conn.state.status}\``).join(', ');

      const embed = new MessageEmbed()
        .setTitle('Debugging information')
        .addField('Github SHA', `\`${config.githubSha}\``, true)
        .addField('Bot Prefix', `\`${config.botPrefix}\``, true)
        .addField('Cache Dir', `\`${config.cacheDir}\``, true)
        .addField('Youtube Base URL', `\`${config.youtubeBaseUrl}\``, true)
        .addField('Youtube DL Executable', `\`${config.youtubeDLExecutable}\``, true)
        .addField('Youtube DL Max Concurrency', `\`${config.youtubeDLMaxConcurrency}\``, true)
        .addField('Youtube DL Retries', `\`${config.youtubeDLRetries}\``, true)
        .addField('Bucket Name', `\`${config.minioBucketName}\``)
        .addField('Bucket Access Key', `\`${config.minioAccessKeyObscured}\``)
        .addField('Connections', connectionsStatus, true);
      await message.channel.send({ embeds: [embed] });
      return;
    }
  }
};

const reportEnqueueResult = ({ successes, errors }: EnqueueResult): MessageEmbed => {
  const errorContent = errors.map((query) => {
    const url = `https://youtube.com/watch?v=${query.videoId}`;
    return `${query.title} - ${query.channelTitle} - [:link:](${url})`;
  });

  const errorText = errorContent.length > 0 ? ['', 'Errors:', ...errorContent].join('\n') : '';

  if (successes.length < 1) {
    return new MessageEmbed().setTitle('An error occurred').setDescription(errorContent.join('\n'));
  }

  if (successes.length === 1) {
    return successes[0]
      .toEmbed()
      .setTitle(successes[0].title ?? 'Unknown')
      .setDescription(errorText);
  }

  const queueEntryStr = (file: AudioFile, index: number) =>
    `\`${index}.\` ${file.toLink()} - ${file.artist}`;

  return new MessageEmbed()
    .setTitle(`Enqueued ${successes.length} items`)
    .setDescription(`${successes.map(queueEntryStr).join('\n')}\n${errorText}`);
};
