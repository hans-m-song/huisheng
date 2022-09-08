import { SlashCommandBuilder } from 'discord.js';

import { emojis } from '../emotes';
import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const clear: Command = {
  spec: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Empty the playlist of queued tracks'),

  onMessage: async (_, message) => {
    await messageVoiceCommand(message, { allowConnect: false }, async (player) => {
      player.playlist.clear();
      await message.react(emojis.bin);
    });
  },
};
