import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { promises as fs } from 'fs';

import { AudioFile } from './AudioFile';
import { Queue } from './Queue';
import { logError, logEvent, secToTime } from './utils';
import { QueryResult } from './Youtube';

export const PLAYER_COLLECTION_NAME = 'player-cache';

export class Player {
  playlist = new Queue<AudioFile>();
  instance = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } })
    .on('error', (error) => {
      logError('Player', error, 'playing', this.playlist.current?.toShortJSON() ?? 'unknown');

      // Attempt a recovery
      this.next();
    })
    .on(AudioPlayerStatus.Idle, () => {
      this.next();
    })
    .on(AudioPlayerStatus.Playing, () => {
      logEvent('Player', 'playing', this.playlist.current?.toShortJSON() ?? 'unknown');
    });

  async next() {
    const next = this.playlist.next();
    if (!next) {
      return;
    }

    const bucketStream = await next.streamFromBucket();
    if (!bucketStream) {
      logError('Player.next', new Error(`failed to create stream for file: "${next.videoId}"`));
      return;
    }

    const { stream, type } = await demuxProbe(bucketStream);
    const resource = createAudioResource(stream, { inputType: type, metadata: next });
    this.instance.play(resource);
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
        const fromBucket = await AudioFile.fromBucketTags(result.videoId);
        const file = fromBucket ?? (await AudioFile.fromUrl(url));
        if (!file) {
          errors.push(result);
          return;
        }

        if (!fromBucket) {
          if (!(await file.saveToBucket())) {
            errors.push(result);
          }

          await fs.unlink(file.filepath).catch((error) => {
            logError('Player.enqueue', error, 'failed to remove file', { path: file.filepath });
          });
        }

        await file.updateBucketMetadata();
        logEvent('Player.enqueue', { videoId, path: file.filepath });
        this.playlist.enqueue(file);
        successes.push(file);

        if (!this.playlist.current) {
          this.next();
        }
      }),
    );

    return { errors, successes };
  }

  getQueueEmbed() {
    return new MessageEmbed()
      .setTitle('Queue')
      .addField('Now playing', this.playlist.current?.toQueueString() ?? 'N/A')
      .addFields(
        this.playlist.map((file, i) => ({
          name: `\`${i}.\` - ${file.title}`,
          value: [file.artist, file.uploader, secToTime(file.duration)].join(' - '),
        })),
      );
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
