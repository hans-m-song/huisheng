import { getVoiceConnections } from '@discordjs/voice';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import { config } from '../config';
import { Command } from '../lib/Command';
import { version } from '../lib/Downloader';
import { getPlayer } from '../lib/Player';

const debugEmbed = async (guildId: string) => {
  const connections = Array.from(getVoiceConnections().entries());
  const connectionsStatus =
    connections.length < 1
      ? 'none'
      : connections.map(([id, conn]) => `${id}: \`${conn.state.status}\``).join(', ');

  const ytdlVersion = await version();

  const playerStatus = getPlayer(guildId).instance.state.status;

  const fields: Record<string, string | number | boolean> = {
    'Cache Dir': config.CACHE_DIR,
    Connections: connectionsStatus,
    'Discord bot prefix': config.DISCORD_BOT_PREFIX,
    'Github SHA': config.GITHUB_SHA,
    'OTLP metrics endpoint': config.OTLP_METRICS_ENDPOINT,
    'OTLP traces endpoint': config.OTLP_TRACES_ENDPOINT,
    'Player status': playerStatus,
    'S3 bucket name': config.S3_BUCKET_NAME,
    'S3 endpoint': config.S3_ENDPOINT,
    'Spotify base url': config.SPOTIFY_BASE_URL,
    'Youtube base url': config.YOUTUBE_BASE_URL,
    'YTDL executable': config.YTDL_EXECUTABLE,
    'YTDL max concurrency': config.YTDL_MAX_CONCURRENCY,
    'YTDL retries': config.YTDL_RETRIES,
    'YTDL version': ytdlVersion ?? 'unknown',
    'YTDLP pot provider enabled': config.YTDLP_POT_PROVIDER_ENABLED,
    'YTDLP pot provider': config.YTDLP_POT_PROVIDER,
  };

  return new EmbedBuilder().setTitle('Debugging information').addFields(
    Object.entries(fields).map(([name, value]) => ({
      name,
      value: `\`${value}\``,
      inline: true,
    })),
  );
};

export const debug: Command = {
  spec: new SlashCommandBuilder().setName('debug').setDescription('Print debug information'),

  onMessage: async (_, message) => {
    if (!message.channel.isSendable()) {
      return;
    }

    const embed = await debugEmbed(message.guild?.id ?? '');
    await message.channel.send({ embeds: [embed] });
  },

  onInteraction: async (_, interaction) => {
    if (!interaction.channel) {
      return;
    }

    if (!interaction.isRepliable()) {
      return;
    }

    const embed = await debugEmbed(interaction.guild?.id ?? '');
    await interaction.reply({ embeds: [embed] });
  },
};
