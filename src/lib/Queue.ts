import { AudioResource } from '@discordjs/voice';

import { YoutubeSearchResult } from './Youtube';

export type QueueItem = AudioResource<YoutubeSearchResult>

export const queueItemMeta = (item: QueueItem) => ({
  id:    item.metadata.id.videoId,
  title: item.metadata.snippet.title,
});

export const linkQueueItem = (item: QueueItem) => {
  const { id, title } = queueItemMeta(item);
  return `[${title}](https://youtube.com/watch?v=${id})`;
};

export class Queue {
  current?: QueueItem;
  items: QueueItem[] = [];

  map = this.items.map;
  forEach = this.items.forEach;
  filter = this.items.filter;
  get length() { return this.items.length; }

  enqueue(item: QueueItem): void {
    this.items.push(item);
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
