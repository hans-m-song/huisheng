import { SlashCommandBuilder } from 'discord.js';

import { customEmoji } from '../emotes';
import { Command } from '../lib/Command';
import { shutdownTelemetry } from '../instrumentation';

const scheduleShutdown = () => {
  setImmediate(async () => {
    try {
      await shutdownTelemetry();
    } finally {
      process.exit(0);
    }
  });
};

export const shutdown: Command = {
  spec: new SlashCommandBuilder().setName('shutdown').setDescription('Shut down the bot'),

  onMessage: async (context, message) => {
    await message.react(context.emoji(customEmoji.DeadInside));
    scheduleShutdown();
  },

  onInteraction: async (context, interaction) => {
    await interaction.reply({ content: context.emoji(customEmoji.DeadInside).toString() });
    scheduleShutdown();
  },
};
