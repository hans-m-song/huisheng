import { getVoiceConnection, getVoiceConnections, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { Message, VoiceBasedChannel } from 'discord.js';

import { getPlayer, Player } from './Player';
import { logError, logEvent } from './utils';

export const voiceCommand = async (
  message: Message,
  allowConnect: boolean,
  callback: (player: Player, connection: VoiceConnection) => Promise<void> | void
): Promise<void> => {
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
    logEvent('voiceCommand', 'not executing', { reason: 'no existing connection and not allowed to connect' });
    return;
  }

  const connection = existing ?? await initializeVoiceConnection(channel);
  logEvent('voiceCommand', { connectionStatus: connection.state.status });
  if (!connection) {
    logEvent('voiceCommand', 'not executing', { reason: 'could not establish connection' });
    return;
  }

  if (connection.state.status === VoiceConnectionStatus.Disconnected) {
    connection.rejoin();
  }

  if (connection.state.status === VoiceConnectionStatus.Signalling) {
    // if connection is stuck in signalling, attempt to create a new one
    connection.destroy();
    await initializeVoiceConnection(channel);
  }

  const player = getPlayer(message.guild.id);
  if (connection.state.status !== VoiceConnectionStatus.Destroyed && !connection.state.subscription) {
    logEvent('voiceCommand', 'subscribing to player');
    connection.subscribe(player.instance);
  }

  await callback(player, connection);
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
