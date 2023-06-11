import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';

import { config } from '../config';
import { logError, logEvent, trimToJsonObject, tryParseJSON } from './utils';

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
  logEvent('downloader', { command: config.youtubeDLExecutable, args: args.join(' ') });

  try {
    child = spawn(config.youtubeDLExecutable, args);
  } catch (error) {
    logError('downloader', error, {
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

    child.on('error', (error) => logError('downloader', error));
    child.stdout.on('data', (chunk) => chunk?.toString && (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => chunk?.toString && (stderr += chunk.toString()));
  });

  if (stderr.length > 0) {
    logError('downloader', stderr, 'unexpected stderr output');
    // continue anyway
    // return null;
  }

  if (stdout.length < 1) {
    logError('downloader', stdout, 'no stdout output');
    return null;
  }

  return { stderr, stdout };
};

export const download = async (target: string): Promise<unknown | null> => {
  const process = await execute(target, ...args);
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
