import { SlashCommandBuilder } from 'discord.js';

import { messageVoiceCommand } from '../lib/audio';
import { Command } from '../lib/Command';

export const np: Command = {
  spec: new SlashCommandBuilder()
    .setName('np')
    .setDescription('Display the currently playing track'),

  onMessage: async (_, message) => {
    await messageVoiceCommand(message, { allowConnect: false }, async (player) => {
      if (!message.channel.isSendable()) {
        return;
      }

      if (!player.playlist.current) {
        await message.channel.send('Not playing anything');
        return;
      }

      const embed = player.playlist.current.toEmbed(player.playlist).setDescription('Now playing');
      await message.channel.send({ embeds: [embed] });
    });
  },
};
