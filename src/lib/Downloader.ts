import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';

import { trimToJsonObject, tryParseJSON } from './utils';
import { config, log } from '../config';
import { AsyncQueue } from './AsyncQueue';

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
  '--prefer-free-formats',
  '--format-sort-force',
  '--format-sort',
  'aext,+size',
];

const execute = async (...args: string[]) => {
  let stderr = '';
  let stdout = '';
  let child: ChildProcessWithoutNullStreams;
  log.info({
    event: 'downloader',
    command: config.youtubeDLExecutable,
    args: args.join(' '),
  });

  try {
    child = spawn(config.youtubeDLExecutable, args);
  } catch (error) {
    log.error({
      event: 'downloader',
      error,
      command: config.youtubeDLExecutable,
      args: args.join(' '),
      message: 'spawn failed',
    });

    console.log({ stderr });
    console.log({ stdout });

    return null;
  }

  await new Promise<void>((resolve, reject) => {
    child.on('close', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`exit status was ${code}, signal was ${signal}`));
        return;
      }

      resolve();
    });

    child.on('error', (error) => log.error({ event: 'downloader', error }));
    child.stdout.on('data', (chunk) => chunk?.toString && (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => chunk?.toString && (stderr += chunk.toString()));
  });

  if (stderr.length > 0) {
    log.error({ event: 'downloader', stderr, message: 'unexpected stderr output' });
    // continue anyway
    // return null;
  }

  if (stdout.length < 1) {
    log.error({ event: 'downloader', message: 'stdout was empty' });
    return null;
  }

  return { stderr, stdout };
};

const queue = new AsyncQueue<Awaited<ReturnType<typeof execute>>>(config.youtubeDLMaxConcurrency);

export const download = async (target: string): Promise<unknown | null> => {
  const process = await queue
    .sync(target, () => execute(target, ...args))
    .catch((error) => {
      log.error({ event: 'Downloader.download', target, error });
      return null;
    });
  if (!process) {
    return null;
  }

  const result = tryParseJSON(trimToJsonObject(process.stdout));
  if (!result) {
    return null;
  }

  return result;
};

export const version = async (): Promise<string | null> => {
  const process = await execute('--version');
  if (!process) {
    return null;
  }

  return process.stdout.trim();
};
