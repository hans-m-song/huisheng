import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

import { emojis } from '../emotes';
import { messageVoiceCommand } from '../lib/audio';
import { Command } from '../lib/Command';
import { reportEnqueueResult } from '../lib/Player';
import { isCanonicalYoutubePlaylistUrl, Youtube, YOUTUBE_PLAYLIST_LIMIT } from '../lib/Youtube';

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
      if (!message.channel.isSendable()) {
        return;
      }

      if (args.length < 1 || args.join(' ').trim() === '') {
        player.play();
        return;
      }

      await message.suppressEmbeds(true);

      const raw = args.join(' ').trim();
      const results = await Youtube.query(raw, 1);
      if (!results || results.length < 1) {
        await message.channel.send('No results found');
        return;
      }

      await message.react(emojis.thinking);
      const enqueueResults = isCanonicalYoutubePlaylistUrl(raw)
        ? results.slice(0, YOUTUBE_PLAYLIST_LIMIT)
        : [results[0]];
      const enqueueResult = await player.enqueue(enqueueResults);
      if (enqueueResult.errors.length > 0 || enqueueResult.successes.length < 1) {
        await message.react(emojis.cross);
      }

      await message.channel.send({
        embeds: [reportEnqueueResult(player.playlist, enqueueResult)],
      });

      if (!player.playlist.current) {
        player.next();
      }
    });
  },
};
