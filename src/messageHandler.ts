import { AudioPlayerStatus, getVoiceConnections } from '@discordjs/voice';
import { Client, Message, MessageEmbed } from 'discord.js';

import { config } from './config';
import { emojiGetter, customEmoji, emojis, numberEmojis } from './emotes';
import { voiceCommand } from './lib/Audio';
import { AudioFile } from './lib/AudioFile';
import { EnqueueResult, getPlayer } from './lib/Player';
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
        await message.react(emoji(customEmoji.FeelsCarlosMan));
        connection.disconnect();
      });
      return;
    }

    case 'summon': {
      await voiceCommand(message, { allowConnect: true }, async () => {
        await message.react(emoji(customEmoji.peepoHappy));
      });
      return;
    }

    case 'search': {
      await voiceCommand(message, { allowConnect: true }, async (player) => {
        await message.react(emojis.thinking);

        const results = await youtube.query(allArgs, 5);
        if (!results || results.length < 1) {
          await message.channel.send('No results found');
          return;
        }

        const sent = await message.channel.send({
          embeds: [
            new MessageEmbed({
              title: 'Search results',
              description: results
                .map((result, i) =>
                  [
                    `\`${i}\``,
                    `"${result.title}"`,
                    result.channelTitle,
                    `[:link:](https://youtube.com/watch?v=${result.videoId})`,
                  ].join(' - '),
                )
                .join('\n'),
            }),
          ],
        });

        await Promise.all(results.map(async (_, index) => sent.react(numberEmojis[index])));

        const collected = await sent.awaitReactions({
          max: 1,
          time: 30000,
          filter: (reaction, user) =>
            !user.bot &&
            !!reaction.emoji.name &&
            Object.values(numberEmojis).includes(reaction.emoji.name),
        });

        const reaction = collected.first();
        await sent.reactions.removeAll();
        await sent.delete();

        if (!reaction || !reaction.emoji.name) {
          await message.react(emojis.cross);
          return;
        }

        const matched = Object.entries(numberEmojis).find(
          ([, emoji]) => reaction.emoji.name === emoji,
        );

        if (!matched) {
          await message.react(emojis.cross);
          return;
        }

        const selected = Number(matched[0]);
        if (isNaN(selected) || !results[selected]) {
          await message.react(emojis.cross);
          return;
        }

        const enqueueResult = await player.enqueue([results[selected]]);
        if (enqueueResult.errors.length > 0 || enqueueResult.successes.length < 1) {
          await message.react(emojis.cross);
        }

        await message.channel.send({
          embeds: [reportEnqueueResult(enqueueResult)],
        });

        if (!player.playlist.current) {
          player.next();
        }
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

        await message.react(emojis.thinking);
        const enqueueResult = await player.enqueue(results);
        if (enqueueResult.errors.length > 0 || enqueueResult.successes.length < 1) {
          await message.react(emojis.cross);
        }

        await message.channel.send({
          embeds: [reportEnqueueResult(enqueueResult)],
        });

        await message.suppressEmbeds(true);

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

    case 'clear': {
      await voiceCommand(message, { allowConnect: false }, async (player) => {
        player.playlist.clear();
        await message.react(emojis.bin);
      });
      return;
    }

    case 'remove': {
      await voiceCommand(message, { allowConnect: false }, async (player) => {
        const [position] = args;
        if (typeof position !== 'number') {
          return;
        }

        player.playlist.remove(position);
        await message.react('🗑️');
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
      const playerStatus = getPlayer(message.guild?.id ?? '').instance.state.status;

      const embed = new MessageEmbed()
        .setTitle('Debugging information')
        .addField('Github SHA', `\`${config.githubSha}\``, true)
        .addField('Bot Prefix', `\`${config.botPrefix}\``, true)
        .addField('Cache Dir', `\`${config.cacheDir}\``, true)
        .addField('Youtube Base URL', `\`${config.youtubeBaseUrl}\``, true)
        .addField('Youtube DL Executable', `\`${config.youtubeDLExecutable}\``, true)
        .addField('Youtube DL Max Concurrency', `\`${config.youtubeDLMaxConcurrency}\``, true)
        .addField('Youtube DL Retries', `\`${config.youtubeDLRetries}\``, true)
        .addField('Bucket Name', `\`${config.minioBucketName}\``, true)
        .addField('Bucket Access Key', `\`${config.minioAccessKeyObscured}\``, true)
        .addField('Connections', connectionsStatus, true)
        .addField('Player Status', `\`${playerStatus}\``, true);
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
