import { spawn } from 'child_process';
import path from 'path';

import { config } from '../config';
import { logError, logEvent, trimToJson, tryParseJSON } from './utils';

let limit: any;
const plimit = Function('return import("p-limit")')() as Promise<typeof import('p-limit')>;
const importPlimit = plimit.then((plimit) => {
  limit = (plimit as any).default(config.youtubeDLMaxConcurrency);
});

export const downloaderCacheDir = path.join(config.cacheDir, 'ytdl');
export const downloaderOutputDir = path.join(config.cacheDir, 'out');
const args = [
  // general
  '--abort-on-error',
  '--no-mark-watched',

  // video selection
  '--no-playlist',

  // download options
  // TODO check this option '--concurrent-fragments',
  '--retries',
  `${config.youtubeDLRetries}`,

  // filesystem options
  '--paths',
  downloaderOutputDir,
  '--output',
  '%(id)s.%(ext)s',
  '--no-overwrites',
  '--continue',
  '--cache-dir',
  downloaderCacheDir,

  // verbosity and simulation options
  '--no-simulate',
  '--dump-json',
  '--no-progress',
  // '--write-info-json',

  // workarounds
  '--no-check-certificates',

  // post-processing options
  '--extract-audio',
];

const execute = async (target: string) => {
  const stderr: any[] = [];
  const stdout: any[] = [];

  try {
    const process = spawn(config.youtubeDLExecutable, [target, ...args]);
    await new Promise<void>((resolve, reject) => {
      process.on('close', (code, signal) => {
        if (code !== 0) {
          reject(new Error(`exit status was ${code}, signal was ${signal}`));
          return;
        }

        resolve();
      });

      process.on('error', (error) => logError('downloader', error));

      process.stdout.on('data', (chunk) => chunk?.toString && stdout.push(chunk.toString()));

      process.stderr.on('data', (chunk) => chunk?.toString && stdout.push(chunk.toString()));
    });

    return { stderr: stderr.join(''), stdout: stdout.join('') };
  } catch (error) {
    logError('downloader', error, 'spawn failed', { target });
    console.log({ stderr });
    console.log({ stdout });
    return null;
  }
};

export const download = async (target: string): Promise<unknown | null> => {
  logEvent('downloader', 'downloading', { target });
  await importPlimit;
  const process = await limit(() => execute(target));
  if (!process) {
    return null;
  }

  if (process.stderr.length > 0) {
    logError('downloader', process.stderr, 'unexpected stderr output');
    return null;
  }

  if (process.stdout.length < 1) {
    logError('downloader', process.stdout, 'no stdout output');
    return null;
  }

  const result = tryParseJSON(trimToJson(process.stdout));
  if (!result) {
    return null;
  }

  return result;
};
