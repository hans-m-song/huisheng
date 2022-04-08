import { AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice';

import { queue, queueItemMeta } from './Queue';
import { logError, logEvent } from './utils';

export const player = createAudioPlayer({
  behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
});


export const playNext = () => {
  const next = queue.next();
  if (next) {
    player.play(next);
  }
};

player.on('error', (error) => {
  logError('player', error, 'playing', queue.current ? queueItemMeta(queue.current) : 'unknown');

  // Attempt a recovery
  playNext();
});

player.on(AudioPlayerStatus.Idle, () => {
  playNext();
});

player.on(AudioPlayerStatus.Playing, () => {
  logEvent('player', 'playing', queue.current ? queueItemMeta(queue.current) : 'unknown');
});
