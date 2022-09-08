import { SlashCommandBuilder } from 'discord.js';

import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const queue: Command = {
  spec: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display the current list of queued tracks'),

  onMessage: async (_, message) => {
    await messageVoiceCommand(message, { allowConnect: false }, async (player) => {
      await message.channel.send({ embeds: [player.getQueueEmbed()] });
    });
  },
};
