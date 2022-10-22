import { SlashCommandBuilder } from 'discord.js';

import { customEmoji } from '../emotes';
import { Command } from '../lib/commands';

export const shutdown: Command = {
  spec: new SlashCommandBuilder().setName('shutdown').setDescription('Shut down the bot'),

  onMessage: async (context, message) => {
    await message.react(context.emoji(customEmoji.DeadInside));
    process.exit(0);
  },

  onInteraction: async (context, interaction) => {
    await interaction.reply({ content: context.emoji(customEmoji.DeadInside).toString() });
    process.exit(0);
  },
};
