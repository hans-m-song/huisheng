import { SlashCommandBuilder } from 'discord.js';

import { voiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const np: Command = {
  spec: new SlashCommandBuilder()
    .setName('np')
    .setDescription('Display the currently playing track'),

  onMessage: async (_, message) => {
    await voiceCommand(message, { allowConnect: false }, async (player) => {
      if (!player.playlist.current) {
        await message.channel.send('Not playing anything');
        return;
      }

      const embed = player.playlist.current.toEmbed().setDescription('Now playing');
      await message.channel.send({ embeds: [embed] });
    });
  },
};
