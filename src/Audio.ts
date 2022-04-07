import { getVoiceConnection, getVoiceConnections, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { Message, VoiceBasedChannel } from 'discord.js';

import { logError, logEvent } from './utils';

export const getVoiceConnectionFromMessage = (message: Message): VoiceConnection | null =>
  message.guild
    ? getVoiceConnection(message.guild.id) ?? null
    : null;

export const messageAuthorVoiceChannel = (message: Message): VoiceBasedChannel | null =>
  message.guild?.members.cache.get(message.author.id)?.voice?.channel ?? null;

export const initializeVoiceConnectionFromMessage = async (message: Message): Promise<VoiceConnection | null> => {
  const channel = messageAuthorVoiceChannel(message);
  if (!channel) {
    return null;
  }

  return initializeVoiceConnection(channel);
};

export const initializeVoiceConnection = async (channel: VoiceBasedChannel): Promise<VoiceConnection> => {
  const existing = getVoiceConnection(channel.guild.id);
  if (existing) {
    return existing;
  }

  const voice = joinVoiceChannel({
    channelId:      channel.id,
    guildId:        channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  voice.on('error', (error) => logError('voice', error));

  await new Promise<void>((resolve) => {
    voice.once(VoiceConnectionStatus.Ready, () => {
      logEvent('audio', `#${channel.name}`, 'connected');
      resolve();
    });
  });

  return voice;
};

export const destroyVoiceConnections = (): void => {
  getVoiceConnections()
    .forEach((connection, guildId) => {
      logEvent('audio', 'disconnecting from', guildId);
      connection.disconnect();
      connection.destroy();
    });
};
