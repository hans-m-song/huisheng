import { SlashCommandBuilder } from 'discord.js';

import { customEmoji } from '../emotes';
import { Command } from '../lib/commands';

export const size: Command = {
  spec: new SlashCommandBuilder().setName('size').setDescription('Measure up'),

  onMessage: async (context, message) => {
    const { reaction, shlong } = generate();
    await message.reply({ content: `\`${shlong}\` ${context.emoji(reaction)}` });
  },

  onInteraction: async (context, interaction) => {
    const { reaction, shlong } = generate();
    await interaction.reply({ content: `\`${shlong}\` ${context.emoji(reaction)}` });
  },
};

const ids = [
  customEmoji.ZeldJape,
  customEmoji.SeemsGood,
  customEmoji.PogChamp,
  customEmoji.Kreygasm,
  customEmoji.FiteHard,
];

const generate = () => {
  const length = Math.ceil(Math.random() * 10);
  const shaft = ''.padEnd(length, '=');
  const reaction = ids[length / 2 - 1];
  const shlong = `8${shaft}D`;
  return { reaction, shlong };
};
