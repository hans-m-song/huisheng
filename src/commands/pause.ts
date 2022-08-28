import { SlashCommandBuilder } from 'discord.js';

import { voiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const pause: Command = {
  spec: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the currently playing track'),

  onMessage: async (_, message) => {
    await voiceCommand(message, { allowConnect: false }, (player) => {
      player.instance.pause();
    });
  },
};
