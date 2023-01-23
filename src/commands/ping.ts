import { getVoiceConnection } from '@discordjs/voice';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import { Command } from '../lib/commands';

export const ping: Command = {
  spec: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if bot is healthy and configured correctly'),

  onMessage: async ({ client }, message) => {
    const voice = message.guild && getVoiceConnection(message.guild.id);
    const embed = new EmbedBuilder().setDescription('pong').addFields([
      { name: 'API ping', value: `${client.ws.ping}ms` },
      { name: 'API latency', value: `${Date.now() - message.createdTimestamp}ms` },
      { name: 'Voice ping (ws)', value: `${voice ? `${voice.ping.ws}ms` : 'N/A'}` },
      { name: 'Voice ping (udp)', value: `${voice ? `${voice.ping.udp}ms` : 'N/A'}` },
    ]);

    await message.channel.send({ embeds: [embed] });
  },
};
