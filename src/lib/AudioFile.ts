import { MessageEmbed } from 'discord.js';
import path from 'path';
import { isMatching, P } from 'ts-pattern';

import { download, downloaderOutputDir } from './Downloader';
import { GuardType, logError, secToMin } from './utils';

export type AudioFileMetadata = GuardType<typeof isAudioFileMetadata>
export const isAudioFileMetadata = isMatching({
  videoId:  P.string,
  url:      P.string,
  filepath: P.string,
  title:    P.optional(P.string),
  artist:   P.optional(P.string),
  uploader: P.optional(P.string),
  duration: P.optional(P.number),
});

export class AudioFile implements AudioFileMetadata {
  videoId: string;
  url: string;
  filepath: string;
  title?: string;
  artist?: string;
  uploader?: string;
  duration?: number;

  constructor(props: AudioFileMetadata) {
    this.videoId = props.videoId;
    this.url = props.url;
    this.filepath = props.filepath;
    this.title = props.title;
    this.duration = props.duration;
    this.uploader = props.uploader;
    this.artist = props.artist;
  }

  static async fromUrl(target: string): Promise<AudioFile | null> {
    const raw = await download(target);
    if (!raw) {
      return null;
    }

    return this.fromInfoJson(raw);
  }

  static fromInfoJson( data: any): AudioFile | null {
    const { id, webpage_url, title, uploader, duration, artist, acodec } = data ?? {};
    const filepath = path.join(downloaderOutputDir, `${id}.${acodec}`);
    const metadata = { videoId: id, filepath, url: webpage_url, title, uploader, duration, artist };
    if (!isAudioFileMetadata(metadata)) {
      logError('AudioFile.fromMetadata', 'data was not of type AudioFileMetadata', data);
      return null;
    }

    return new AudioFile(metadata);
  }

  toEmbed() {
    return new MessageEmbed()
      .setURL(this.url)
      .addField('Artist', this.artist ?? 'Unknown', true)
      .addField('Uploader', this.uploader ?? 'Unknown', true)
      .addField('Duration', secToMin(this.duration) ?? 'Unknown', true);
  }

  toShortJSON() {
    return { id: this.videoId, title: this.title };
  }

  toLink() {
    return `[${this.title}](${this.url})`;
  }

  toJSON() {
    return {
      videoId:  this.videoId,
      url:      this.url,
      filepath: this.filepath,
      title:    this.title,
      duration: this.duration,
      uploader: this.uploader,
      artist:   this.artist,
    };
  }
}
