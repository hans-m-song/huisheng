import {
  getVoiceConnection,
  getVoiceConnections,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { Message, VoiceBasedChannel } from 'discord.js';

import { getPlayer, Player } from './Player';
import { logError, logEvent } from './utils';

type VoiceCommandOptions = { allowConnect?: boolean; allowRetry?: boolean };

export const voiceCommand = async (
  message: Message,
  options: VoiceCommandOptions,
  callback: (player: Player, connection: VoiceConnection) => Promise<void> | void,
): Promise<void> => {
  const { allowConnect, allowRetry } = {
    allowConnect: false,
    allowRetry: true,
    ...options,
  };

  if (!message.guild) {
    await message.channel.send('Must be in a server');
    return;
  }

  const channel = message.member?.voice.channel;
  if (!channel) {
    await message.channel.send('Must be in a voice channel');
    return;
  }

  const existing = getVoiceConnection(message.guild.id);
  if (!existing && !allowConnect) {
    logEvent('voiceCommand', 'not executing', {
      reason: 'no existing connection and not allowed to connect',
    });
    return;
  }

  const connection = existing ?? (await initializeVoiceConnection(channel));
  logEvent('voiceCommand', { connectionStatus: connection.state.status });
  if (!connection) {
    logEvent('voiceCommand', 'not executing', {
      reason: 'could not establish connection',
    });
    return;
  }

  if (connection.state.status === VoiceConnectionStatus.Disconnected) {
    connection.rejoin();
  }

  if (connection.state.status === VoiceConnectionStatus.Signalling && allowRetry) {
    // if connection is stuck in signalling, attempt to create a new one and retry
    logEvent('voiceCommand', 'recreating connection', {
      channel: channel.name,
    });

    connection.destroy();
    await initializeVoiceConnection(channel);
    return voiceCommand(message, { ...options, allowRetry: false }, callback);
  }

  const player = getPlayer(message.guild.id);
  if (
    connection.state.status !== VoiceConnectionStatus.Destroyed &&
    !connection.state.subscription
  ) {
    logEvent('voiceCommand', 'subscribing to player');
    connection.subscribe(player.instance);
  }

  await callback(player, connection);
};

export const initializeVoiceConnection = async (
  channel: VoiceBasedChannel,
): Promise<VoiceConnection> => {
  const existing = getVoiceConnection(channel.guild.id);
  if (existing) {
    return existing;
  }

  const voice = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
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
  getVoiceConnections().forEach((connection, guildId) => {
    logEvent('audio', 'disconnecting from', guildId);
    connection.disconnect();
    connection.destroy();
  });
};
