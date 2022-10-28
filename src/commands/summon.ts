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
      const reaction = Math.random() < 0.1 ? customEmoji.FiteGASM : customEmoji.peepoHappy;
      await message.react(context.emoji(reaction));
    });
  },
};
