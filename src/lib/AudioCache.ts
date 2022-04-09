import { promises as fs } from 'fs';
import path from 'path';

import { AudioFile } from './AudioFile';
import { downloaderOutputDir } from './Downloader';
import { logError } from './utils';

class AudioCache {
  cache = new Map<string, AudioFile>();

  save(audioFile: AudioFile) {
    this.cache.set(audioFile.videoId, audioFile);
  }

  async load(id: string): Promise<AudioFile | null> {
    const loaded = this.cache.get(id);
    if (loaded) {
      return loaded;
    }

    const downloaded = await fs.readdir(downloaderOutputDir) .catch((error) => {
      logError('AudioCache.load', error, 'failed to read downloader output directory');
      return null;
    });

    if (!downloaded) {
      return null;
    }

    const match = downloaded.find((file) => file.includes(id));
    if (!match) {
      return null;
    }

    return new AudioFile({
      filepath: path.join(downloaderOutputDir, match),
      url:      `https://youtube.com/watch?v=${id}`,
      videoId:  id,
    });
  }
}

export const cache = new AudioCache();
