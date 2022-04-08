import { promises as fs } from 'fs';
import path from 'path';
import youtubedl from 'youtube-dl-exec';

import { config } from '../config';
import { cache } from './AudioCache';
import { AudioFile } from './AudioFile';

const outputDir = path.join(config.youtubeDLCacheDir, 'out');
const outputTemplate = path.join(outputDir, '%(id)s.%(ext)s');

export const download = async (target: string) => {
  console.log('downloading', target);

  const result = await youtubedl(target, {
    abortOnError:  true,
    markWatched:   false,
    printJson:     true,
    noPlaylist:    true,
    retries:       config.youtubeDLRetries,
    cacheDir:      config.youtubeDLCacheDir,
    extractAudio:  true,
    writeInfoJson: true,
    output:        outputTemplate,
  });

  const { id, title, uploader, duration, artist, acodec } = result;
  const file = path.join(outputDir, `${id}.${acodec}`);
  console.log({ file, id, title, uploader, duration, artist ,acodec } );
};

export const hydrate = async () => {
  const filenames = await fs.readdir(outputDir);

  const files = await Promise.all(filenames.map( async (file) => {
    const filepath = path.join(outputDir, file);
    return { filepath, stats: await fs.stat(filepath) };
  }));

  const toPrune = files.filter(({ stats }) =>
    stats.isFile() && Date.now() - stats.atimeMs > config.youtubeDLCacheTTL);

  const toKeep = files.filter(({ filepath }) =>
    !toPrune.find((file) => file.filepath === filepath));

  console.log({
    toPrune: toPrune.map(({ filepath }) => filepath),
    toKeep:  toKeep.map(({ filepath }) => filepath),
  });

  await Promise.all(toKeep.map(async ({ filepath }) => {
    const meta = await AudioFile.fromFilepath(filepath);
    if (meta) {
      cache.save(meta);
    }
  }) );

  // toPrune.map(({ filepath }) => fs.unlink(filepath));

  return toKeep;
};

hydrate();
