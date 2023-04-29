import { EmbedBuilder, EmbedField } from 'discord.js';

import { AudioFile, AudioFileMetadata } from './AudioFile';
import { CountDown } from './CountDown';
import { Queue } from './Queue';
import { secToTime } from './utils';

export class PlaylistItem extends AudioFile {
  timer: CountDown;

  constructor(file: AudioFileMetadata) {
    super(file);
    this.timer = new CountDown(file.duration);
  }

  secondsUntil(playlist: Queue<PlaylistItem>) {
    let queuedDuration = 0;

    for (const item of playlist.items) {
      if (item.videoId === this.videoId) {
        break;
      }

      queuedDuration += item.duration;
    }

    if (playlist.current) {
      queuedDuration += playlist.current.timer.remainder;
    }

    return queuedDuration;
  }

  toEmbed(playlist: Queue<PlaylistItem>) {
    return new EmbedBuilder()
      .setURL(this.url)
      .setTitle(this.title ?? 'Unknown')
      .addFields([
        { name: 'Artist', value: this.artist ?? 'Unknown', inline: true },
        { name: 'Uploader', value: this.uploader, inline: true },
        {
          name: 'Duration',
          value: this.timer.ticking
            ? `${secToTime(this.timer.runtime)} / ${secToTime(this.duration)}`
            : secToTime(this.duration),
          inline: true,
        },
        {
          name: 'ETA',
          value: secToTime(this.secondsUntil(playlist)),
          inline: true,
        },
      ]);
  }

  toEmbedField(playlist: Queue<PlaylistItem>): EmbedField {
    const index = playlist.items.indexOf(this);
    const title = `[${this.title}](${this.url})`;
    const name = index > -1 ? `\`${index}.\` ${title}` : title;
    const etaStr = secToTime(this.secondsUntil(playlist));
    const durationStr = secToTime(this.duration);
    const timeStr = etaStr ? `${durationStr} (eta ${etaStr})` : durationStr;

    const value = `${this.uploader} - ${timeStr}`;
    return { name, value, inline: false };
  }

  toQueueString() {
    const title = `[${this.title}](${this.url})`;
    const timeStr = this.timer.ticking
      ? `${secToTime(this.timer.runtime)} / ${secToTime(this.duration)}`
      : secToTime(this.duration);

    return `${title} - ${this.uploader} - ${timeStr}`;
  }
}
