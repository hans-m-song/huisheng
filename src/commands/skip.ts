import { SlashCommandBuilder } from 'discord.js';

import { voiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const skip: Command = {
  spec: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently playing track'),

  onMessage: async (_, message) => {
    await voiceCommand(message, { allowConnect: false }, (player) => {
      player.instance.stop();
      player.next();
    });
  },
};
