import { SlashCommandBuilder } from 'discord.js';

import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const remove: Command = {
  spec: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the playlist'),

  onMessage: async (_, message, args) => {
    await messageVoiceCommand(message, { allowConnect: false }, async (player) => {
      const [position] = args;
      if (typeof position !== 'number') {
        return;
      }

      player.playlist.remove(position);
      await message.react('🗑️');
    });
  },
};
