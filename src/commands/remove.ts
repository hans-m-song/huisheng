import { SlashCommandBuilder } from 'discord.js';

import { emojis } from '../emotes';
import { messageVoiceCommand } from '../lib/audio';
import { Command } from '../lib/Command';

export const remove: Command = {
  spec: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the playlist'),

  onMessage: async (_, message, args) => {
    await messageVoiceCommand(message, { allowConnect: false }, async (player) => {
      const [position] = args;
      const index = parseInt(position);
      if (isNaN(index)) {
        await message.react(emojis.cross);
        return;
      }

      player.playlist.remove(index);
      await message.react('🗑️');
    });
  },
};
