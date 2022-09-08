import { SlashCommandBuilder } from 'discord.js';

import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const stop: Command = {
  spec: new SlashCommandBuilder().setName('stop').setDescription('Stop playing the current track'),

  onMessage: async (_, message) => {
    await messageVoiceCommand(message, { allowConnect: false }, (player) => {
      player.instance.stop();
    });
  },
};
