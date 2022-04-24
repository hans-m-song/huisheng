import { MessageEmbed } from 'discord.js';
import { Collection } from 'mongodb';
import path from 'path';
import { isMatching, P } from 'ts-pattern';

import { download, downloaderOutputDir } from './Downloader';
import { GuardType, logError, logEvent, secToTime } from './utils';

export type AudioFileMetadata = GuardType<typeof isAudioFileMetadata>
export const isAudioFileMetadata = isMatching({
  videoId:        P.string,
  url:            P.string,
  filepath:       P.string,
  title:          P.string,
  artist:         P.optional(P.string),
  uploader:       P.string,
  duration:       P.number,
  createdAt:      P.number,
  lastAccessedAt: P.number,
});

export class AudioFile implements AudioFileMetadata {
  videoId: string;
  url: string;
  filepath: string;
  title: string;
  artist?: string;
  uploader: string;
  duration: number;
  createdAt: number;
  lastAccessedAt: number;

  constructor(props: AudioFileMetadata) {
    this.videoId = props.videoId;
    this.url = props.url;
    this.filepath = props.filepath;
    this.title = props.title;
    this.artist = props.artist;
    this.uploader = props.uploader;
    this.duration = props.duration;
    this.createdAt = props.createdAt;
    this.lastAccessedAt = props.lastAccessedAt;
  }

  static async fromUrl(target: string): Promise<AudioFile | null> {
    const raw = await download(target);
    if (!raw) {
      return null;
    }

    return this.fromInfoJson(raw);
  }

  static fromInfoJson(data: any): AudioFile | null {
    const { id, webpage_url, title, uploader, duration, artist, ext } = data ?? {};
    const filepath = path.join(downloaderOutputDir, `${id}.${ext}`);
    const metadata = {
      videoId:        id,
      url:            webpage_url,
      filepath,
      title,
      duration,
      uploader,
      artist,
      createdAt:      Date.now(),
      lastAccessedAt: Date.now(),
    };
    if (!isAudioFileMetadata(metadata)) {
      logError('AudioFile.fromInfoJson', 'data was not of type AudioFileMetadata', data);
      return null;
    }

    logEvent('AudioFile', 'loaded file metadata from info json');
    return new AudioFile(metadata);
  }

  static async fromCollection (collection: Collection | null, videoId: string): Promise<AudioFile | null> {
    if (!collection) {
      return null;
    }

    const result = await collection.findOne<AudioFileMetadata>({ videoId });
    if (!result) {
      return null;
    }

    logEvent('AudioFile', 'loaded file metadata from collection');
    return new AudioFile(result);
  }

  async saveToCollection(collection: Collection | null) {
    if (!collection) {
      return;
    }

    const { createdAt,...attributes } = this.toJSON();
    logEvent('AudioFile', 'caching file metadata', attributes);
    await collection.createIndexes([
      { key: { videoId: 1 } },
      { key: { lastAccessedAt: 1 } },
    ]);
    await collection.updateOne(
      { videoId: this.videoId },
      { $set: attributes, $setOnInsert: { createdAt } },
      { upsert: true }
    );
  }

  toEmbed() {
    return new MessageEmbed()
      .setURL(this.url)
      .setTitle(this.title ?? 'Unknown')
      .addField('Artist', this.artist ?? 'Unknown', true)
      .addField('Uploader', this.uploader ?? 'Unknown', true)
      .addField('Duration', secToTime(this.duration) ?? 'Unknown', true);
  }

  toShortJSON() {
    return { id: this.videoId, title: this.title };
  }

  toLink() {
    return `[${this.title}](${this.url})`;
  }

  toJSON() {
    return {
      videoId:        this.videoId,
      url:            this.url,
      filepath:       this.filepath,
      title:          this.title,
      artist:         this.artist,
      uploader:       this.uploader,
      duration:       this.duration,
      createdAt:      this.createdAt,
      lastAccessedAt: this.lastAccessedAt,
    };
  }
}
