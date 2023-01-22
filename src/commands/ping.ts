import { SlashCommandBuilder } from 'discord.js';

import { Command } from '../lib/commands';

export const ping: Command = {
  spec: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if bot is healthy and configured correctly'),

  onMessage: async ({ client }, message) => {
    const ping = client.ws.ping;
    const latency = Date.now() - message.createdTimestamp;
    await message.channel.send(`pong\nping: ${ping}, latency: ${latency}`);
  },
};
