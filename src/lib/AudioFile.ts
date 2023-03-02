import { EmbedField, EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { isMatching, P } from 'ts-pattern';

import { Bucket } from './Bucket';
import { download, downloaderOutputDir } from './Downloader';
import { GuardType, logError, logEvent, secToTime } from './utils';

export type AudioFileMetadata = GuardType<typeof isAudioFileMetadata>;
export const isAudioFileMetadata = isMatching({
  videoId: P.string,
  url: P.string,
  filepath: P.string,
  title: P.string,
  uploader: P.string,
  artist: P.string,
  duration: P.number,
  acodec: P.string,
});

export class AudioFile implements AudioFileMetadata {
  videoId: string;
  url: string;
  filepath: string;
  title: string;
  uploader: string;
  artist: string;
  duration: number;
  acodec: string;

  constructor(props: AudioFileMetadata) {
    this.videoId = props.videoId;
    this.url = props.url;
    this.filepath = props.filepath;
    this.title = props.title;
    this.uploader = props.uploader;
    this.artist = props.artist;
    this.duration = props.duration;
    this.acodec = props.acodec;
  }

  static async fromUrl(target: string): Promise<AudioFile | null> {
    const raw = await download(target);
    if (!raw) {
      return null;
    }

    return this.fromInfoJson(raw);
  }

  static async fromInfoJson(data: any): Promise<AudioFile | null> {
    const { id, webpage_url, title, duration, uploader, artist, acodec, ext, audio_ext, filename } =
      data ?? {};

    const possibleFilepaths = [
      filename,
      path.join(downloaderOutputDir, `${id}.${ext}`),
      path.join(downloaderOutputDir, `${id}.${audio_ext}`),
    ];

    const filepath = await getByFilepath(possibleFilepaths);
    if (!filepath) {
      logError('AudioFile.fromInfoJson', 'could not find file', possibleFilepaths);
      return null;
    }

    const metadata: AudioFileMetadata = {
      videoId: id,
      url: webpage_url,
      filepath,
      title,
      uploader,
      artist: artist ?? 'Unknown',
      duration,
      acodec,
    };
    logEvent('AudioFile.fromInfoJson', metadata);

    if (!isAudioFileMetadata(metadata)) {
      logError('AudioFile.fromInfoJson', 'data was not of type AudioFileMetadata', metadata);
      return null;
    }

    logEvent('AudioFile', 'loaded file metadata from info json');
    return new AudioFile(metadata);
  }

  static async fromBucketTags(id: string): Promise<AudioFile | null> {
    const objectName = path.join('cache', id);
    const exists = await Bucket.stat(objectName);
    if (!exists) {
      return null;
    }

    const tags = await Bucket.getTags(objectName);
    if (!tags) {
      return null;
    }

    const metadata = { ...tags, duration: parseInt(tags?.duration) };
    if (!isAudioFileMetadata(metadata)) {
      logEvent('AudioFile', 'bucket tags was not of type AudioFileMetadata', metadata);
      return null;
    }

    logEvent('AudioFile', 'loaded from bucket');
    return new AudioFile(metadata);
  }

  async saveToBucket(): Promise<boolean> {
    const dest = path.join('cache', this.videoId);
    return Bucket.put(this.filepath, dest);
  }

  async updateBucketMetadata() {
    const dest = path.join('cache', this.videoId);
    await Bucket.setTags(dest, { ...this.toJSON(), duration: `${this.duration}` });
  }

  async streamFromBucket() {
    return Bucket.getStream(path.join('cache', this.videoId));
  }

  toEmbed() {
    return new EmbedBuilder()
      .setURL(this.url)
      .setTitle(this.title ?? 'Unknown')
      .addFields([
        { name: 'Artist', value: this.artist ?? 'Unknown', inline: true },
        { name: 'Uploader', value: this.uploader, inline: true },
        { name: 'Duration', value: secToTime(this.duration) ?? 'Unknown', inline: true },
      ]);
  }

  toEmbedField(prefix?: string): EmbedField {
    const name = [prefix, this.title].filter(Boolean).join(' ');
    const value = [
      this.artist,
      this.uploader,
      secToTime(this.duration),
      `[:link:](${this.url})`,
    ].join(' - ');
    return { name, value, inline: false };
  }

  toQueueString() {
    return [this.title, this.artist, secToTime(this.duration), `[:link:](${this.url})`].join(' - ');
  }

  toShortJSON() {
    return { id: this.videoId, title: this.title };
  }

  toLink() {
    return `[${this.title}](${this.url})`;
  }

  toJSON() {
    return {
      videoId: this.videoId,
      url: this.url,
      filepath: this.filepath,
      title: this.title,
      uploader: this.uploader,
      artist: this.artist,
      duration: this.duration,
    };
  }
}

const getByFilepath = async (filepaths: string[]) => {
  for (const filepath of filepaths) {
    try {
      await fs.stat(filepath);
      return filepath;
    } catch {
      continue;
    }
  }

  return null;
};
