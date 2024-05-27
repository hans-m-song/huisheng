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
import { QueryResult } from './Youtube';
import { log } from '../config';

export class Player {
  playlist = new Queue<PlaylistItem>();
  instance = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } })
    .on('error', (error) => {
      log.error({
        event: 'Player.error',
        error,
        current: this.playlist.current?.toShortJSON() ?? 'none',
      });

      // Attempt a recovery
      this.next();
    })
    .on(AudioPlayerStatus.Idle, () => {
      this.next();
    })
    .on(AudioPlayerStatus.Playing, () => {
      log.info({
        event: 'Player.playing',
        current: this.playlist.current?.toShortJSON() ?? 'none',
      });
    });

  async next() {
    this.stop();

    const next = this.playlist.next();
    if (!next) {
      return;
    }

    const bucketStream = await next.streamFromBucket();
    if (!bucketStream) {
      log.error({
        event: 'Player.next',
        error: new Error(`failed to create stream for file: "${next.videoId}"`),
      });
      return;
    }

    const { stream, type } = await demuxProbe(bucketStream);
    const resource = createAudioResource(stream, { inputType: type, metadata: next });
    this.instance.play(resource);
    next.timer.start();
  }

  stop() {
    if (this.playlist.current) {
      this.playlist.current.timer.stop();
      this.instance.stop();
    }
  }

  play() {
    if (this.instance.state.status === AudioPlayerStatus.Paused) {
      this.instance.unpause();
      this.playlist.current?.timer.start();
      return;
    }

    this.next();
  }

  pause() {
    if (this.instance.state.status === AudioPlayerStatus.Playing) {
      this.instance.pause(true);
      this.playlist.current?.timer.stop();
    }
  }

  async enqueue(results: QueryResult[]): Promise<EnqueueResult> {
    const errors: QueryResult[] = [];
    const successes: PlaylistItem[] = [];

    await results.reduce(async (previous, result) => {
      await previous;
      const { videoId } = result;

      const url = `https://youtube.com/watch?v=${videoId}`;
      const fromBucket = await AudioFile.fromBucketTags(videoId);
      const file = fromBucket ?? (await AudioFile.fromUrl(url));
      if (!file) {
        errors.push(result);
        return;
      }

      if (!fromBucket) {
        const saved = await file.saveToBucket();
        if (!saved) {
          errors.push(result);
        }

        await fs.unlink(file.filepath).catch((error) => {
          log.error({
            event: 'Player.enqueue',
            message: 'failed to remove file',
            error,
            path: file.filepath,
          });
        });
      }

      await file.updateBucketMetadata();
      log.info({ event: 'Player.enqueue', videoId, path: file.filepath });
      const item = new PlaylistItem(file);
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
      .addFields(this.playlist.items.map((item) => item.toEmbedField(this.playlist)));
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

export const reportEnqueueResult = (
  playlist: Queue<PlaylistItem>,
  { successes, errors }: EnqueueResult,
): EmbedBuilder => {
  const errorContent = errors.map((query) => {
    const url = `https://youtube.com/watch?v=${query.videoId}`;
    return `${query.title} - ${query.channelTitle} - [:link:](${url})`;
  });

  const errorText = errorContent.length > 0 ? ['', 'Errors:', ...errorContent].join('\n') : '';

  if (successes.length < 1) {
    return new EmbedBuilder().setTitle('An error occurred').setDescription(errorContent.join('\n'));
  }

  if (successes.length === 1) {
    const embed = successes[0].toEmbed(playlist).setTitle(successes[0].title ?? 'Unknown');
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
