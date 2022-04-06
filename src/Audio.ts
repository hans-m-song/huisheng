import { createAudioPlayer, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';

import { logError, logEvent } from './utils';

export const initializeVoiceConnection = async (channel: VoiceBasedChannel) =>{
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

  return { voice, player: initializeAudioPlayer(), reason: exitPromise(voice) };
};

const initializeAudioPlayer = () => {
  const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
  player.on('error', (error) => logError('player', error));

  return player;
};

const exitPromise = (voice: VoiceConnection) =>
  new Promise((resolve) => {
    voice.once(VoiceConnectionStatus.Destroyed, () => {
      resolve('voice connection destroyed');
    });

    process.once('SIGINT', () => {
      resolve('received sigint');
    });
  });
