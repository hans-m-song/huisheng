import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';

import { trace } from '@opentelemetry/api';
import { config, log } from '../config';
import { addSpanAttributes, addSpanError, traceFn } from './telemetry';
import { trimToJsonObject, tryParseJSON } from './utils';

export const downloaderCacheDir = path.join(config.CACHE_DIR, 'ytdl');
export const downloaderOutputDir = path.join(config.CACHE_DIR, 'out');
const args = [
  // general
  '--abort-on-error',
  '--no-mark-watched',

  // video selection
  '--no-playlist',

  // download options
  // TODO check this option '--concurrent-fragments',
  '--retries',
  `${config.YTDL_RETRIES}`,

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
  config.YTDLP_POT_PROVIDER_ENABLED
    ? ['--extractor-args', `youtubepot-bgutilhttp:base_url=${config.YTDLP_POT_PROVIDER}`]
    : [],

  // post-processing options
  '--extract-audio',
  '--prefer-free-formats',
  '--format-sort-force',
  '--format-sort',
  'aext,+size',
].flat();

const tracer = trace.getTracer('downloader');

const execute = async (...args: string[]) =>
  traceFn(tracer, 'downloader/execute', async () => {
    addSpanAttributes({ args: args.join(' ') });

    let stderr = '';
    let stdout = '';
    let child: ChildProcessWithoutNullStreams;
    log.info({ event: 'downloader', command: config.YTDL_EXECUTABLE, args: args.join(' ') });

    try {
      child = spawn(config.YTDL_EXECUTABLE, args);
    } catch (error) {
      addSpanError(error);
      log.error({
        event: 'downloader',
        error,
        command: config.YTDL_EXECUTABLE,
        args: args.join(' '),
        message: 'spawn failed',
      });

      console.log({ stderr });
      console.log({ stdout });

      return null;
    }

    const exitCode = await new Promise<number | null>((resolve) => {
      child.on('close', resolve);
      child.on('error', (error) => log.error({ event: 'downloader', error }));
      child.stdout.on('data', (chunk) => chunk?.toString && (stdout += chunk.toString()));
      child.stderr.on('data', (chunk) => chunk?.toString && (stderr += chunk.toString()));
    });

    addSpanAttributes({ exit_code: exitCode ?? 0 });

    if (exitCode !== null && exitCode > 0) {
      addSpanError({ message: 'unexpected exit code' });
      log.error({ event: 'downloader', stderr, exitCode, message: 'unexpected exit code' });
      // continue anyway
      // return null;
    }

    if (stderr.length > 0) {
      log.error({ event: 'downloader', stderr, message: 'unexpected stderr output' });
      // continue anyway
      // return null;
    }

    if (stdout.length < 1) {
      addSpanError({ message: 'stdout was empty' });
      log.error({ event: 'downloader', message: 'stdout was empty' });
      return null;
    }

    return { stderr, stdout };
  });

export const download = async (target: string): Promise<unknown | null> =>
  traceFn(tracer, 'downloader/download', async () => {
    const process = await execute(target, ...args);
    if (!process) {
      return null;
    }

    const result = tryParseJSON(trimToJsonObject(process.stdout));
    if (!result) {
      return null;
    }

    return result;
  });

export const version = async (): Promise<string | null> =>
  traceFn(tracer, 'downloader/version', async () => {
    const process = await execute('--version');
    if (!process) {
      return null;
    }

    return process.stdout.trim();
  });
