import { EmbedBuilder, EmbedField } from 'discord.js';

import { AudioFile, AudioFileMetadata } from './AudioFile';
import { Queue } from './Queue';
import { secToTime } from './utils';

export class PlaylistItem extends AudioFile {
  queuedAt: number;
  playedAt: number;

  constructor(file: AudioFileMetadata, queuedAt: number, playedAt: number) {
    super(file);
    this.queuedAt = queuedAt;
    this.playedAt = playedAt;
  }

  static fromAudioFile(file: AudioFile, queuedAt: number, playedAt: number) {
    return new PlaylistItem(file.toJSON(), queuedAt, playedAt);
  }

  secondsPlayed() {
    const diff = Date.now() - this.playedAt;
    return Math.floor(diff / 1000);
  }

  secondsRemaining() {
    return this.duration - this.secondsPlayed();
  }

  secondsUntil(items: PlaylistItem[], current?: PlaylistItem) {
    let queuedDuration = 0;

    for (const item of items) {
      if (item.videoId === this.videoId) {
        break;
      }

      queuedDuration += item.duration;
    }

    if (current) {
      queuedDuration += current.secondsRemaining();
    }

    return queuedDuration;
  }

  toEmbed() {
    const secondsPlayed = this.secondsPlayed();

    return new EmbedBuilder()
      .setURL(this.url)
      .setTitle(this.title ?? 'Unknown')
      .addFields([
        { name: 'Artist', value: this.artist ?? 'Unknown', inline: true },
        { name: 'Uploader', value: this.uploader, inline: true },
        {
          name: 'Duration',
          value:
            secondsPlayed > 1
              ? `${secToTime(secondsPlayed)} / ${secToTime(this.duration)}`
              : secToTime(this.duration),
          inline: true,
        },
      ]);
  }

  toEmbedField(playlist: Queue<PlaylistItem>): EmbedField {
    const index = playlist.items.indexOf(this);
    const name = index > -1 ? `\`${index}.\` ${this.title}` : this.title;
    const etaStr = secToTime(this.secondsUntil(playlist.items, playlist.current));
    const durationStr = secToTime(this.duration);
    const timeStr = etaStr ? `${durationStr} (eta ${etaStr})` : durationStr;
    const linkStr = this.link();

    const value = `${this.uploader} - ${timeStr} (${linkStr})`;
    return { name, value, inline: false };
  }

  toQueueString() {
    const secondsPlayed = this.secondsPlayed();
    const timeStr =
      secondsPlayed > 1
        ? `${secToTime(secondsPlayed)} / ${secToTime(this.duration)}`
        : secToTime(this.duration);
    const linkStr = this.link();

    return `${this.title} - ${this.uploader} - ${timeStr} (${linkStr})`;
  }

  link(textContent = ':link:') {
    return `[${textContent}](${this.url})`;
  }
}
