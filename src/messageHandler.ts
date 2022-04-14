import { AudioPlayerStatus, getVoiceConnections } from '@discordjs/voice';
import { Client, Message, MessageEmbed } from 'discord.js';

import { config } from './config';
import { emojiGetter, emojis } from './emotes';
import { voiceCommand } from './lib/Audio';
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
      await message.channel.send('pong');
      return;
    }

    case 'gtfo': {
      await voiceCommand(message, false, async (player, connection) => {
        player.instance.pause();
        await message.react(emoji(emojis.FeelsCarlosMan));
        connection.disconnect();
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

        const results = await youtube.query(allArgs);
        if (!results || results.length < 1) {
          await message.channel.send('No results found');
          return;
        }

        const { successes, errors } = await player.enqueue(results);

        const embed = player.getQueueEmbed();

        if (errors.length > 0) {
          await message.react('❌');
          const errorDetail = errors.map((error) => {
            const url = `https://youtube.com/watch?v=${error.videoId}`;
            return `${error.title} - ${error.channelTitle} [:link:](${url})`;
          }).join('\n');
          embed.setDescription(embed.description += '\n' + errorDetail);
          embed.setTitle(successes.length > 0 ? 'Loaded with errors' : 'Error loading');
        }

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
          const embed = player.playlist.current.metadata
            .toEmbed()
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

        // TODO remove debugging
        logEvent(
          'queue',
          { count: player.playlist.length },
          player.playlist
            .map((item, i) => `${i}. ${item.metadata.toLink()}`)
            .join('\n')
        );

        const embed = new MessageEmbed()
          .setTitle('Queued items')
          .setDescription(
            player.playlist
              .map((item, i) => `${i}. ${item.metadata.toLink()}`)
              .join('\n')
          );
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

    case 'debug': {
      const connections = Array.from(getVoiceConnections().entries());
      const connectionsStatus = connections.length < 1
        ? 'none'
        : connections
          .map(([ id, conn ]) => `${id}: ${conn.state.status}`)
          .join(', ');

      const embed = new MessageEmbed()
        .setTitle('Debugging information')
        .addField('Bot Prefix', config.botPrefix)
        .addField('Cache Dir', config.cacheDir)
        .addField('Youtube Base URL', config.youtubeBaseUrl)
        .addField('Youtube DL Executable', config.youtubeDLExecutable)
        .addField('Youtube DL Max Concurrency', `${config.youtubeDLMaxConcurrency}`)
        .addField('Youtube DL Retries', `${config.youtubeDLRetries}`)
        .addField('Youtube DL Cache TTL', `${config.youtubeDLCacheTTL}`)
        .addField('Connections', connectionsStatus)
        .setFooter({ text: `Github Sha: ${config.githubSha}` })
        .setTimestamp();
      await message.channel.send({ embeds: [ embed ] });
      return;
    }
  }
};
