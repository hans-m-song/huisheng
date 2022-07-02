import {
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { createReadStream } from 'fs';

import { AudioFile } from './AudioFile';
import { Queue } from './Queue';
import { logError, logEvent, secToTime } from './utils';
import { QueryResult } from './Youtube';

export const PLAYER_COLLECTION_NAME = 'player-cache';

export class Player {
  playlist = new Queue<AudioResource<AudioFile>>();
  instance = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
  });

  constructor() {
    this.instance.on('error', (error) => {
      logError(
        'player',
        error,
        'playing',
        this.playlist.current?.metadata?.toShortJSON() ?? 'unknown',
      );

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
    switch (this.instance.state.status) {
      case AudioPlayerStatus.Paused:
        this.instance.unpause();
        return;

      case AudioPlayerStatus.Playing:
        this.instance.pause(true);
        return;
    }
  }

  async enqueue(results: QueryResult[]): Promise<EnqueueResult> {
    const errors: QueryResult[] = [];
    const successes: AudioFile[] = [];

    await Promise.all(
      results.map(async (result) => {
        const { videoId } = result;
        const url = `https://youtube.com/watch?v=${videoId}`;
        const file = (await AudioFile.fromBucket(result.videoId)) ?? (await AudioFile.fromUrl(url));
        if (!file) {
          errors.push(result);
          return;
        }

        await file.saveToBucket();
        const { stream, type } = await demuxProbe(createReadStream(file.filepath));
        const resource = createAudioResource(stream, {
          inputType: type,
          metadata: file,
        });
        logEvent('enqueue', { videoId, path: file.filepath });
        this.playlist.enqueue(resource);
        successes.push(file);
      }),
    );

    return { errors, successes };
  }

  getQueueEmbed() {
    const queue = this.playlist
      .map(({ metadata: { title, artist, duration, url } }, i) => {
        const details = [title, artist ?? '?', secToTime(duration)].join(' - ');
        return `\`${i}.\` ${details} [:link:](${url})`;
      })
      .join('\n');

    return new MessageEmbed().setTitle('Queue').setDescription(queue);
  }
}

export interface EnqueueResult {
  errors: QueryResult[];
  successes: AudioFile[];
}

const players = new Map<string, Player>();

export const getPlayer = (guildId: string): Player => {
  const existing = players.get(guildId);
  if (existing) {
    return existing;
  }

  const player = new Player();
  players.set(guildId, player);
  return player;
};
