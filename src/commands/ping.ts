import { SlashCommandBuilder } from 'discord.js';

import { Command } from '../lib/commands';

export const ping: Command = {
  spec: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if bot is healthy and configured correctly'),

  onMessage: async (_, message) => {
    await message.channel.send('pong');
  },
};
