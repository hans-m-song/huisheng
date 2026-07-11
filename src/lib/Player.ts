import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';
import { promises as fs } from 'fs';

import { metrics } from '@opentelemetry/api';
import { log } from '../config';
import { AudioFile } from './AudioFile';
import { PlaylistItem } from './PlaylistItem';
import { Queue } from './Queue';
import { addSpanAttributes, addSpanError, TraceMethod, traceFn } from './telemetry';
import { QueryResult } from './Youtube';

const meter = metrics.getMeter('player');
const playbackErrors = meter.createCounter('playback.errors', {
  description: 'audio player playback errors',
});
const enqueueResults = meter.createCounter('enqueue.result', {
  description: 'enqueue outcome per item',
});

export class Player {
  playlist = new Queue<PlaylistItem>();
  instance = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } })
    .on('error', (error) => {
      playbackErrors.add(1);
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

  @TraceMethod({ root: true })
  async next() {
    this.stop();

    const next = this.playlist.next();
    if (!next) {
      return;
    }

    addSpanAttributes({ videoId: next.videoId, title: next.title });

    const bucketStream = await next.streamFromBucket();
    if (!bucketStream) {
      const error = new Error(`failed to create stream for file: "${next.videoId}"`);
      addSpanError(error);
      log.error({ event: 'Player.next', error });
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

  playPause() {
    switch (this.instance.state.status) {
      case AudioPlayerStatus.Paused:
        this.play();
        return;

      case AudioPlayerStatus.Playing:
        this.pause();
        return;
    }
  }

  @TraceMethod()
  async enqueue(results: QueryResult[]): Promise<EnqueueResult> {
    const errors: QueryResult[] = [];
    const successes: PlaylistItem[] = [];

    await results.reduce(async (previous, result) => {
      await previous;
      const { videoId } = result;

      await traceFn('player', 'enqueue.item', {}, async () => {
        addSpanAttributes({ videoId });

        const url = `https://youtube.com/watch?v=${videoId}`;
        const fromBucket = await AudioFile.fromBucketTags(videoId);
        const file = fromBucket ?? (await AudioFile.fromUrl(url));
        if (!file) {
          errors.push(result);
          enqueueResults.add(1, { status: 'error' });
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
        enqueueResults.add(1, { status: 'success' });

        if (!this.playlist.current) {
          this.next();
        }
      });
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

meter
  .createObservableGauge('players.active', { description: 'active guild players' })
  .addCallback((result) => result.observe(players.size));

meter
  .createObservableGauge('queue.depth', { description: 'queued items per guild' })
  .addCallback((result) => {
    for (const [guildId, player] of players) {
      result.observe(player.playlist.length, { guildId });
    }
  });

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
