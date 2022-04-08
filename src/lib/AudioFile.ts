import path from 'path';
import { isMatching, P } from 'ts-pattern';

import { GuardType, logError, tryParseJSON, tryReadFile } from './utils';

const getMetadataPathFromPath = (filepath: string): string => {
  const { dir, name } = path.parse(filepath);
  return path.join(dir, `${name}.info.json`);
};

export type AudioFileMetadata = GuardType<typeof isAudioFileMetadata>
export const isAudioFileMetadata = isMatching({
  id:       P.string,
  filepath: P.string,
  title:    P.string,
  duration: P.number,
  uploader: P.string,
  artist:   P.string,
});

export class AudioFile implements AudioFileMetadata {
  id: string;
  filepath: string;
  title: string;
  duration: number;
  uploader: string;
  artist: string;

  constructor(props: AudioFileMetadata) {
    this.id = props.id;
    this.filepath = props.filepath;
    this.title = props.title;
    this.duration = props.duration;
    this.uploader = props.uploader;
    this.artist = props.artist;
  }

  static async fromFilepath(filepath: string): Promise<AudioFile | null> {
    const metadataPath = getMetadataPathFromPath(filepath);
    const raw = await tryReadFile(metadataPath);
    if (!raw) {
      return null;
    }

    const parsed = tryParseJSON(raw);
    if (!raw) {
      return null;
    }

    if (!isAudioFileMetadata({ ...parsed, filepath })) {
      logError('AudioFile.fromMetadata', 'parsed data was not of type AudioFileMetadata', parsed);
      return null;
    }

    return new AudioFile(parsed);
  }

  toJSON() {
    return {
      id:       this.id,
      filepath: this.filepath,
      title:    this.title,
      duration: this.duration,
      uploader: this.uploader,
      artist:   this.artist,
    };
  }
}
