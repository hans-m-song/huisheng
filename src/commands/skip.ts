import { SlashCommandBuilder } from 'discord.js';

import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const skip: Command = {
  spec: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently playing track'),

  onMessage: async (_, message) => {
    await messageVoiceCommand(message, { allowConnect: false }, (player) => {
      player.next();
    });
  },
};
