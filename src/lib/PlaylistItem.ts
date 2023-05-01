import { EmbedBuilder, EmbedField } from 'discord.js';

import { AudioFile, AudioFileMetadata } from './AudioFile';
import { CountDown } from './CountDown';
import { Queue } from './Queue';
import { secToTimeFragments, secToISOTime } from './utils';

export class PlaylistItem extends AudioFile {
  timer: CountDown;

  constructor(file: AudioFileMetadata) {
    super(file);
    this.timer = new CountDown(file.duration);
  }

  secondsUntil(playlist: Queue<PlaylistItem>) {
    if (playlist.current?.videoId === this.videoId) {
      return 0;
    }

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
    const runtime = secToISOTime(this.timer.runtime);
    const duration = secToISOTime(this.duration);
    const eta = secToTimeFragments(this.secondsUntil(playlist));

    return new EmbedBuilder()
      .setURL(this.url)
      .setTitle(this.title ?? 'Unknown')
      .addFields([
        { name: 'Artist', value: this.artist ?? 'Unknown', inline: true },
        { name: 'Uploader', value: this.uploader ?? 'Unknown', inline: true },
        {
          name: 'Duration',
          value: this.timer.ticking
            ? `${runtime} / ${duration}`
            : playlist.current?.videoId !== this.videoId
            ? `${duration} (eta ${eta})`
            : duration,
          inline: true,
        },
      ]);
  }

  toEmbedField(playlist: Queue<PlaylistItem>): EmbedField {
    const index = playlist.items.indexOf(this);
    const name = index > -1 ? `\`${index}.\` ${this.title}` : this.title;

    const eta = this.secondsUntil(playlist);
    const duration = secToISOTime(this.duration);
    const time = eta > 0 ? `${duration} (eta ${secToISOTime(eta)})` : duration;
    const value = `${this.link} ${this.uploader} - ${time}`;

    return { name, value, inline: false };
  }

  get link() {
    return `[:globe_with_meridians:](${this.url})`;
  }

  toQueueString() {
    const time = this.timer.ticking
      ? `${secToISOTime(this.timer.runtime)} / ${secToISOTime(this.duration)}`
      : secToISOTime(this.duration);

    return `${this.link} ${this.title} - ${this.uploader} - ${time}`;
  }
}
