import { SlashCommandBuilder } from 'discord.js';

import { customEmoji } from '../emotes';
import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const summon: Command = {
  spec: new SlashCommandBuilder()
    .setName('summon')
    .setDescription('Summon bot into a voice channel'),

  onMessage: async (context, message) => {
    await messageVoiceCommand(message, { allowConnect: true }, async () => {
      await message.react(context.emoji(customEmoji.peepoHappy));
    });
  },
};
