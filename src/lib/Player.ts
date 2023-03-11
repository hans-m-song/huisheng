import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';
import { promises as fs } from 'fs';

import { AudioFile } from './AudioFile';
import { PlaylistItem } from './PlaylistItem';
import { Queue } from './Queue';
import { logError, logEvent } from './utils';
import { QueryResult } from './Youtube';

export class Player {
  playlist = new Queue<PlaylistItem>();
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
    next.playedAt = Date.now();

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
    const successes: PlaylistItem[] = [];

    await results.reduce(async (previous, result) => {
      await previous;
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
      const item = PlaylistItem.fromAudioFile(file, Date.now(), 0);
      this.playlist.enqueue(item);
      successes.push(item);

      if (!this.playlist.current) {
        this.next();
      }
    }, Promise.resolve());

    return { errors, successes };
  }

  getQueueEmbed() {
    return new EmbedBuilder()
      .setTitle('Queue')
      .addFields([
        {
          name: 'Now playing',
          value: this.playlist.current?.toQueueString() ?? 'N/A',
          inline: false,
        },
      ])
      .addFields(this.playlist.map((item) => item.toEmbedField(this.playlist)));
  }
}

export interface EnqueueResult {
  errors: QueryResult[];
  successes: PlaylistItem[];
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

export const reportEnqueueResult = ({ successes, errors }: EnqueueResult): EmbedBuilder => {
  const errorContent = errors.map((query) => {
    const url = `https://youtube.com/watch?v=${query.videoId}`;
    return `${query.title} - ${query.channelTitle} - [:link:](${url})`;
  });

  const errorText = errorContent.length > 0 ? ['', 'Errors:', ...errorContent].join('\n') : '';

  if (successes.length < 1) {
    return new EmbedBuilder().setTitle('An error occurred').setDescription(errorContent.join('\n'));
  }

  if (successes.length === 1) {
    const embed = successes[0].toEmbed().setTitle(successes[0].title ?? 'Unknown');
    if (errorText.length > 0) {
      embed.setDescription(errorText);
    }

    return embed;
  }

  const queueEntryStr = (file: AudioFile, index: number) =>
    `\`${index}.\` ${file.toLink()} - ${file.artist}`;

  return new EmbedBuilder()
    .setTitle(`Enqueued ${successes.length} items`)
    .setDescription(`${successes.map(queueEntryStr).join('\n')}\n${errorText}`);
};
