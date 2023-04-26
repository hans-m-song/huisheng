import { SlashCommandBuilder } from 'discord.js';

import { customEmoji } from '../emotes';
import { messageVoiceCommand } from '../lib/Audio';
import { Command } from '../lib/commands';

export const gtfo: Command = {
  spec: new SlashCommandBuilder()
    .setName('gtfo')
    .setDescription('Kick the bot from the voice channel'),

  onMessage: async (context, message) => {
    await messageVoiceCommand(message, { allowConnect: false }, async (player, connection) => {
      player.stop();
      await message.react(context.emoji(customEmoji.FeelsCarlosMan));
      connection.disconnect();
    });
  },
};
