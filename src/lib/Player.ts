import { AudioPlayerStatus, AudioResource, createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice';

import { AudioFile } from './AudioFile';
import { Queue } from './Queue';
import { logError, logEvent } from './utils';

export const playlist = new Queue<AudioResource<AudioFile>>();
export const player = createAudioPlayer({
  behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
});

export const playNext = () => {
  const next = playlist.next();
  if (next) {
    player.play(next);
  }
};

export const playPause = () => {
  switch(player.state.status) {
    case AudioPlayerStatus.Paused:
      player.unpause();
      return;

    case AudioPlayerStatus.Playing:
      player.pause(true);
      return;
  }
};

player.on('error', (error) => {
  logError('player', error, 'playing', playlist.current?.metadata?.toShortJSON() ?? 'unknown');

  // Attempt a recovery
  playNext();
});

player.on(AudioPlayerStatus.Idle, () => {
  playNext();
});

player.on(AudioPlayerStatus.Playing, () => {
  logEvent('player', 'playing', playlist.current?.metadata?.toShortJSON() ?? 'unknown');
});
