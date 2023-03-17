import { AudioPlayerStatus } from '@discordjs/voice';
import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

import { emojis } from '../emotes';
import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';
import { reportEnqueueResult } from '../lib/Player';
import { youtube } from '../lib/Youtube';

export const play: Command = {
  spec: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Search for a video and play it or unpause the current track')
    .addStringOption(
      new SlashCommandStringOption()
        .setName('url')
        .setDescription('Direct url to play')
        .setMinLength(3),
    )
    .addStringOption(
      new SlashCommandStringOption()
        .setName('query')
        .setDescription('Fuzzy text search, will use the first result')
        .setMinLength(3),
    ),

  onMessage: async (_, message, args) => {
    await messageVoiceCommand(message, { allowConnect: true }, async (player) => {
      if (args.length < 1 || args.join(' ').trim() === '') {
        if (player.instance.state.status === AudioPlayerStatus.Paused) {
          player.instance.unpause();
        }
        return;
      }

      await message.suppressEmbeds(true);

      const results = await youtube.query(args.join(' '));
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

      if (!player.playlist.current) {
        player.next();
      }
    });
  },
};
