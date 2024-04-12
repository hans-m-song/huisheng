import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from 'discord.js';

import { emojis, numberEmojis } from '../emotes';
import { interactionVoiceCommand, messageVoiceCommand } from '../lib/audio';
import { Command } from '../lib/Command';
import { reportEnqueueResult } from '../lib/Player';
import { collect } from '../lib/utils';
import { QueryResult, Youtube } from '../lib/Youtube';

const searchResultEmbed = (results: QueryResult[]) =>
  new EmbedBuilder()
    .setTitle('Search results')
    .setDescription(
      results
        .map((result, i) =>
          [
            `\`${i}\``,
            `"${result.title}"`,
            result.channelTitle,
            `[:link:](https://youtube.com/watch?v=${result.videoId})`,
          ].join(' - '),
        )
        .join('\n'),
    );

export const search: Command = {
  spec: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for a video to play')
    .addStringOption(
      new SlashCommandStringOption()
        .setName('query')
        .setDescription('Fuzzy text search')
        .setMinLength(3)
        .setRequired(true),
    ),

  onMessage: async (_, message, args) => {
    await messageVoiceCommand(message, { allowConnect: true }, async (player) => {
      await message.react(emojis.thinking);

      const results = await Youtube.query(args.join(' '), 5);
      if (!results || results.length < 1) {
        await message.channel.send('No results found');
        return;
      }

      const sent = await message.channel.send({ embeds: [searchResultEmbed(results)] });
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
        embeds: [reportEnqueueResult(player.playlist, enqueueResult)],
      });

      if (!player.playlist.current) {
        player.next();
      }
    });
  },

  onInteraction: async (_, interaction) => {
    await interactionVoiceCommand(
      interaction,
      { allowConnect: true },
      async (player, _, channel) => {
        const query = interaction.options.getString('query');
        if (!query) {
          await interaction.reply('Must provide a query');
          return;
        }

        const results = await Youtube.query(query, 5);
        if (!results || results.length < 1) {
          await interaction.reply('No results found');
          return;
        }

        await interaction.reply({
          content: 'Pick an option',
          // embeds: [searchResultEmbed(results)],
          embeds: [],
          components: results.map(
            (result, i) =>
              new ActionRowBuilder<ButtonBuilder>({
                components: [
                  new ButtonBuilder()
                    .setCustomId(`${i}`)
                    .setLabel(`${result.title} - ${result.channelTitle}`)
                    .setStyle(ButtonStyle.Secondary),
                ],
              }),
          ),
        });

        const collected = await collect(channel.createMessageComponentCollector({ max: 1 }));
        if (collected.size < 1) {
          return;
        }

        const selected = collected.first();
        const index = Number(selected?.customId);
        if (!selected || isNaN(index) || !results[index]) {
          return;
        }

        await selected.deferUpdate();
        const enqueueResult = await player.enqueue([results[index]]);
        await interaction.deleteReply();
        await channel.send({ embeds: [reportEnqueueResult(player.playlist, enqueueResult)] });

        if (!player.playlist.current) {
          player.next();
        }
      },
    );
  },
};
