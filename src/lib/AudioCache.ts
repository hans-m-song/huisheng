import { AudioFile } from './AudioFile';

class AudioCache {
  cache = new Map<string, AudioFile>();

  save(audioFile: AudioFile) {
    this.cache.set(audioFile.id, audioFile);
  }

  load(id: string): AudioFile | null {
    return this.cache.get(id) ?? null;
  }
}

export const cache = new AudioCache();
