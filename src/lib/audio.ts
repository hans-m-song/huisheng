import {
  generateDependencyReport,
  getVoiceConnection,
  getVoiceConnections,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionState,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  Message,
  TextBasedChannel,
  VoiceBasedChannel,
} from 'discord.js';

import { log } from '../config';
import { getPlayer, Player } from './Player';

type VoiceCommandOptions = { allowConnect?: boolean; allowRetry?: boolean };

export const messageVoiceCommand = async (
  message: Message,
  options: VoiceCommandOptions,
  callback: (player: Player, connection: VoiceConnection) => Promise<void> | void,
): Promise<void> => {
  if (!message.channel.isSendable()) {
    return;
  }

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
    log.info({
      event: 'audio.messageVoiceCommand',
      message: 'not executing',
      reason: 'no existing connection and not allowed to connect',
    });
    return;
  }

  const connection = existing ?? (await initializeVoiceConnection(channel));
  log.info({ event: 'audio.messageVoiceCommand', connectionStatus: connection.state.status });
  if (!connection) {
    log.info({
      event: 'audio.messageVoiceCommand',
      message: 'not executing',
      reason: 'could not establish connection',
    });
    return;
  }

  if (connection.state.status === VoiceConnectionStatus.Disconnected) {
    connection.rejoin();
  }

  if (connection.state.status === VoiceConnectionStatus.Signalling && allowRetry) {
    // if connection is stuck in signalling, attempt to create a new one and retry
    log.info({
      event: 'audio.messageVoiceCommand',
      message: 'recreating connection',
      channel: channel.name,
    });
    connection.destroy();
    await initializeVoiceConnection(channel);
    return messageVoiceCommand(message, { ...options, allowRetry: false }, callback);
  }

  const player = getPlayer(message.guild?.id);
  if (
    connection.state.status !== VoiceConnectionStatus.Destroyed &&
    !connection.state.subscription
  ) {
    log.info({ event: 'audio.messageVoiceCommand', message: 'subscribing to player' });
    connection.subscribe(player.instance);
  }

  await callback(player, connection);
};

export const interactionVoiceCommand = async (
  interaction: ChatInputCommandInteraction,
  options: VoiceCommandOptions,
  callback: (
    player: Player,
    connection: VoiceConnection,
    channel: TextBasedChannel,
  ) => Promise<void> | void,
): Promise<void> => {
  const { allowConnect, allowRetry } = {
    allowConnect: false,
    allowRetry: true,
    ...options,
  };

  if (!interaction.inGuild()) {
    await interaction.reply('Must be in a server');
    return;
  }

  if (!interaction.channel) {
    await interaction.reply('Must be sent from a text based channel');
    return;
  }

  const guild = interaction.client.guilds.cache.get(interaction.guildId);
  const member = guild?.members.cache.get(interaction.member.user.id);
  const channel = member?.voice.channel;
  if (!channel) {
    await interaction.reply('Must be in a voice channel');
    return;
  }

  const existing = getVoiceConnection(interaction.guildId);
  if (!existing && !allowConnect) {
    log.info({
      event: 'audio.interactionVoiceCommand',
      message: 'not executing',
      reason: 'no existing connection and not allowed to connect',
    });
    return;
  }

  const connection = existing ?? (await initializeVoiceConnection(channel));
  log.info({ event: 'audio.interactionVoiceCommand', connectionStatus: connection.state.status });
  if (!connection) {
    log.info({
      event: 'audio.interactionVoiceCommand',
      message: 'not executing',
      reason: 'could not establish connection',
    });
    return;
  }

  if (connection.state.status === VoiceConnectionStatus.Disconnected) {
    connection.rejoin();
  }

  if (connection.state.status === VoiceConnectionStatus.Signalling && allowRetry) {
    // if connection is stuck in signalling, attempt to create a new one and retry
    log.info({
      event: 'audio.interactionVoiceCommand',
      message: 'recreating connection',
      channel: channel.name,
    });
    connection.destroy();
    await initializeVoiceConnection(channel);
    return interactionVoiceCommand(interaction, { ...options, allowRetry: false }, callback);
  }

  const player = getPlayer(interaction.guildId);
  if (
    connection.state.status !== VoiceConnectionStatus.Destroyed &&
    !connection.state.subscription
  ) {
    log.info({ event: 'audio.interactionVoiceCommand', message: 'subscribing to player' });
    connection.subscribe(player.instance);
  }

  await callback(player, connection, interaction.channel);
};

const initializeVoiceConnection = async (channel: VoiceBasedChannel): Promise<VoiceConnection> => {
  const existing = getVoiceConnection(channel.guild.id);
  if (existing) {
    return existing;
  }

  const voice = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  voice.on('error', (error) => log.error({ event: 'audio.voice.error', error }));
  voice.on('debug', (message) => log.debug({ event: 'audio.voice.debug', message }));
  voice.on('stateChange', (oldState, newState) => {
    if (oldState.status === newState.status) {
      return;
    }

    log.info({
      event: 'audio.voice.stateChange',
      channel: channel.name,
      oldStatus: oldState.status,
      newStatus: newState.status,
    });
  });

  // https://github.com/discordjs/discord.js/issues/9185#issuecomment-1452514375
  voice.on('stateChange', (oldState, newState) => {
    Reflect.get(oldState, 'networking')?.off('stateChange', handleVoiceStateChange);
    Reflect.get(newState, 'networking')?.on('stateChange', handleVoiceStateChange);

    if (
      (oldState.status === VoiceConnectionStatus.Ready &&
        newState.status === VoiceConnectionStatus.Connecting) ||
      (oldState.status === VoiceConnectionStatus.Connecting &&
        newState.status === VoiceConnectionStatus.Signalling)
    ) {
      voice.configureNetworking();
    }
  });

  await VoiceConnection.once(voice, VoiceConnectionStatus.Ready);

  return voice;
};

const handleVoiceStateChange = (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
  const udp = Reflect.get(newState, 'udp');
  clearInterval(udp?.keepAliveInterval);
};

export const destroyVoiceConnections = (): void => {
  getVoiceConnections().forEach((connection, guildId) => {
    log.info({ event: 'audio.destroyVoiceConnections', message: 'disconnecting voice', guildId });
    connection.disconnect();
    connection.destroy();
  });
};

export const dependencyReport = () => {
  const rawReport = generateDependencyReport();
  const sections = rawReport.replace(/-{2,}/g, '').trim().split('\n\n');

  const report: Record<string, Record<string, string>> = {};
  sections.map((section) => {
    const [header, ...lines] = section.split('\n');
    report[header] = {};
    lines.forEach((line) => {
      const [key, value] = line.replace(/^- /, '').split(': ');
      report[header][key] = value;
    });
  });

  return report;
};
