import { SlashCommandBuilder } from 'discord.js';

import { messageVoiceCommand } from '../lib/audio';
import { Command } from '../lib/Command';

export const pause: Command = {
  spec: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the currently playing track'),

  onMessage: async (_, message) => {
    await messageVoiceCommand(message, { allowConnect: false }, (player) => {
      player.pause();
    });
  },
};
