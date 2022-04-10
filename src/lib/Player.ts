import { AudioPlayerStatus, AudioResource, createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice';

import { AudioFile } from './AudioFile';
import { Queue } from './Queue';
import { Alias, logError, logEvent } from './utils';

export class Player {
  playlist = new Queue<AudioResource<AudioFile>>();
  instance = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

  constructor() {
    this.instance.on('error', (error) => {
      logError('player', error, 'playing', this.playlist.current?.metadata?.toShortJSON() ?? 'unknown');

      // Attempt a recovery
      this.next();
    });

    this.instance.on(AudioPlayerStatus.Idle, () => {
      this.next();
    });

    this.instance.on(AudioPlayerStatus.Playing, () => {
      logEvent('player', 'playing', this.playlist.current?.metadata?.toShortJSON() ?? 'unknown');
    });
  }

  next() {
    const next = this.playlist.next();
    if (next) {
      this.instance.play(next);
    }
  }

  playPause() {
    switch(this.instance.state.status) {
      case AudioPlayerStatus.Paused:
        this.instance.unpause();
        return;

      case AudioPlayerStatus.Playing:
        this.instance.pause(true);
        return;
    }
  }
}

type guildid = Alias<string>
const players = new Map<guildid, Player>();

export const getPlayer = (guildId: string): Player => {
  const existing = players.get(guildId);
  if (existing) {
    return existing;
  }

  const player = new Player();
  players.set(guildId, player);
  return player;
};
