import { getVoiceConnections } from '@discordjs/voice';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import { config } from '../config';
import { Command } from '../lib/commands';
import { getPlayer } from '../lib/Player';

const debugEmbed = () => {
  const connections = Array.from(getVoiceConnections().entries());
  const connectionsStatus =
    connections.length < 1
      ? 'none'
      : connections.map(([id, conn]) => `${id}: \`${conn.state.status}\``).join(', ');

  return new EmbedBuilder().setTitle('Debugging information').addFields(
    [
      { name: 'Github SHA', value: `\`${config.githubSha}\`` },
      { name: 'Bot Prefix', value: `\`${config.botPrefix}\`` },
      { name: 'Cache Dir', value: `\`${config.cacheDir}\`` },
      { name: 'Youtube Base URL', value: `\`${config.youtubeBaseUrl}\`` },
      { name: 'Youtube DL Executable', value: `\`${config.youtubeDLExecutable}\`` },
      { name: 'Youtube DL Max Concurrency', value: `\`${config.youtubeDLMaxConcurrency}\`` },
      { name: 'Youtube DL Retries', value: `\`${config.youtubeDLRetries}\`` },
      { name: 'Bucket Name', value: `\`${config.minioBucketName}\`` },
      { name: 'Bucket Access Key', value: `\`${config.minioAccessKeyObscured}\`` },
      { name: 'Connections', value: connectionsStatus },
    ].map((field) => ({ ...field, inline: true })),
  );
};

export const debug: Command = {
  spec: new SlashCommandBuilder().setName('debug').setDescription('Print debug information'),

  onMessage: async (_, message) => {
    const playerStatus = getPlayer(message.guild?.id ?? '').instance.state.status;

    await message.channel.send({
      embeds: [
        debugEmbed().addFields({
          name: 'Player Status',
          value: `\`${playerStatus}\``,
          inline: true,
        }),
      ],
    });
  },

  onInteraction: async (_, interaction) => {
    if (!interaction.channel) {
      return;
    }

    const playerStatus = getPlayer(interaction.guild?.id ?? '').instance.state.status;
    const embed = debugEmbed().addFields({
      name: 'Player Status',
      value: `\`${playerStatus}\``,
      inline: true,
    });

    if (interaction.isRepliable()) {
      await interaction.reply({ embeds: [embed] });
    }
  },
};
