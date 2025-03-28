import { getVoiceConnection } from '@discordjs/voice';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import { Command } from '../lib/Command';

export const ping: Command = {
  spec: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if bot is healthy and configured correctly'),

  onMessage: async ({ client }, message) => {
    if (!message.channel.isSendable()) {
      return;
    }

    const voice = message.guild && getVoiceConnection(message.guild.id);
    const embed = new EmbedBuilder().setDescription('pong').addFields([
      { name: 'API ping', value: `${client.ws.ping}ms`, inline: true },
      { name: 'API latency', value: `${Date.now() - message.createdTimestamp}ms`, inline: true },
      { name: 'Voice ping (ws)', value: `${voice ? `${voice.ping.ws}ms` : 'N/A'}`, inline: true },
      { name: 'Voice ping (udp)', value: `${voice ? `${voice.ping.udp}ms` : 'N/A'}`, inline: true },
    ]);

    await message.channel.send({ embeds: [embed] });
  },
};
