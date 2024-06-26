import fs from 'fs/promises';
import path from 'path';
import { isMatching, P } from 'ts-pattern';

import { log } from '../config';
import { Bucket } from './Bucket';
import { download, downloaderOutputDir } from './Downloader';
import { GuardType } from './utils';

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
  format_id: P.union(P.string, P.number),
  format: P.union(P.string, P.number),
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
  format_id: string | number;
  format: string | number;

  constructor(props: AudioFileMetadata) {
    this.videoId = props.videoId;
    this.url = props.url;
    this.filepath = props.filepath;
    this.title = props.title;
    this.uploader = props.uploader;
    this.artist = props.artist;
    this.duration = props.duration;
    this.acodec = props.acodec;
    this.format_id = props.format_id;
    this.format = props.format;
  }

  static async fromUrl(target: string): Promise<AudioFile | null> {
    const raw = await download(target);
    if (!raw) {
      return null;
    }

    return this.fromInfoJson(raw);
  }

  static async fromInfoJson(data: any): Promise<AudioFile | null> {
    const {
      id,
      webpage_url,
      title,
      duration,
      uploader,
      artist,
      acodec,
      ext,
      audio_ext,
      filename,
      format_id,
      format,
    } = data ?? {};

    const possibleFilepaths = [
      filename,
      path.join(downloaderOutputDir, `${id}.${ext}`),
      path.join(downloaderOutputDir, `${id}.${acodec}`),
      path.join(downloaderOutputDir, `${id}.${audio_ext}`),
    ];

    const filepath = await getByFilepath(possibleFilepaths);
    if (!filepath) {
      log.error({
        event: 'AudioFile.fromInfoJson',
        message: 'could not find file',
        possibleFilepaths,
      });
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
      format_id,
      format,
    };
    log.info({ event: 'AudioFile.fromInfoJson', metadata });

    if (!isAudioFileMetadata(metadata)) {
      log.error({
        event: 'AudioFile.fromInfoJson',
        message: 'data was not of type AudioFileMetadata',
        metadata,
      });
      return null;
    }

    log.info({ event: 'AudioFile.fromInfoJson', message: 'loaded file metadata from info json' });
    return new AudioFile(metadata);
  }

  static async fromBucketTags(id: string): Promise<AudioFile | null> {
    const objectName = path.join('cache', id);
    const exists = await Bucket.stat(objectName);
    if (!exists) {
      return null;
    }

    const metadata = await Bucket.getTags(objectName);
    if (!metadata) {
      return null;
    }

    if (!isAudioFileMetadata(metadata)) {
      log.info({
        event: 'AudioFile.fromBucketTags',
        message: 'bucket tags was not of type AudioFileMetadata',
        metadata,
      });
      return null;
    }

    log.info({ event: 'AudioFile.fromBucketTags', message: 'loaded from bucket' });
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

  toShortJSON() {
    return { id: this.videoId, title: this.title };
  }

  toLink() {
    return `[${this.title}](${this.url})`;
  }

  toJSON(): AudioFileMetadata {
    return {
      videoId: this.videoId,
      url: this.url,
      filepath: this.filepath,
      title: this.title,
      uploader: this.uploader,
      artist: this.artist,
      duration: this.duration,
      acodec: this.acodec,
      format_id: this.format_id,
      format: this.format,
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
