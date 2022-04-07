import { AudioPlayerStatus, AudioResource, createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice';

import { logError, logEvent } from './utils';
import { YoutubeSearchResult } from './Youtube';

export type QueueItem = AudioResource<YoutubeSearchResult>

const queueItemMeta = (item: QueueItem) => ({
  id:    item.metadata.id.videoId,
  title: item.metadata.snippet.title,
});

export const linkQueueItem = (item: QueueItem) => {
  const { id, title } = queueItemMeta(item);
  return `[${title}](https://youtube.com/watch?v=${id})`;
};

class Queue {
  current?: QueueItem;
  items: QueueItem[] = [];

  map = this.items.map;
  forEach = this.items.forEach;
  filter = this.items.filter;

  get length() {
    return this.items.length;
  }

  enqueue(item: QueueItem): void {
    this.items.push(item);
    if (player.state.status === AudioPlayerStatus.Idle) {
      this.current = item;
      player.play(item);
    }
  }

  next(): QueueItem | undefined {
    this.current = this.items.shift();
    return this.current;
  }

  clear(): void {
    this.items = [];
  }
}

export const queue = new Queue();

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
