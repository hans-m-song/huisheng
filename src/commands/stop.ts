import { SlashCommandBuilder } from 'discord.js';

import { voiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const stop: Command = {
  spec: new SlashCommandBuilder().setName('stop').setDescription('Stop playing the current track'),

  onMessage: async (_, message) => {
    await voiceCommand(message, { allowConnect: false }, (player) => {
      player.instance.stop();
    });
  },
};
