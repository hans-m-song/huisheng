import axios from 'axios';
import { Collection, Collector, CommandInteraction, Message } from 'discord.js';
import { promises as fs } from 'fs';
import newrelic from 'newrelic';
import internal from 'stream';
import { isMatching, P } from 'ts-pattern';
import { inspect } from 'util';

import { config } from '../config';

// eslint-disable-next-line @typescript-eslint/ban-types
export type Alias<T> = T & {};
export type GuardType<T> = T extends (arg: any) => arg is infer G ? G : T;
export type Resolver<T> = (value: T | PromiseLike<T>) => void;
export type Rejecter = (reason: any) => void;
export type primitive = number | string | boolean | undefined | null;

export const isPrimitive = isMatching(P.union(P.string, P.number, P.boolean, P.nullish));

export const isNotNullish = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isNotNullishEntry = <T>(pair: [string, T | null | undefined]): pair is [string, T] =>
  pair[1] !== null && pair[1] !== undefined;

export const clamp = (value: number, lower: number, upper: number) =>
  Math.max(lower, Math.min(upper, value));

export const numEnv = (
  value: string | undefined,
  options: { default: number; min?: number; max?: number },
): number => {
  if (!value) {
    return options.default;
  }

  const parsed = Number(value);
  if (isNaN(parsed)) {
    return options.default;
  }

  return clamp(parsed, options.min ?? parsed, options.max ?? parsed);
};

export const boolEnv = (value: string | undefined, defaultValue: boolean) =>
  typeof value === 'string' ? value === 'true' : defaultValue;

export const assertEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`required env is not defined: "${value}"`);
  }

  return value;
};

export const logEvent = (event: string, metadata?: string | Record<string, unknown>) => {
  if (config.debug) {
    console.log(`[${event}]`, inspect(metadata, { depth: Infinity }));
  } else {
    const data = typeof metadata === 'string' ? { message: metadata } : metadata;
    console.log(JSON.stringify({ ...data, event }));
  }
};

export const logMessage = (message: Message) =>
  logEvent('message', {
    channel: (message.channel as any)?.name ?? message.channel.type,
    author: message.author.tag,
    content: message.content.slice(config.botPrefix.length),
  });

export const logCommandInteraction = (interaction: CommandInteraction) =>
  logEvent('interaction', {
    channel: interaction.channel?.id ?? 'unknown',
    author: interaction.user.tag,
    content: interaction.commandName,
  });

const serialiseError = (error: any): any => {
  if (isPrimitive(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const raw = JSON.stringify(error.toJSON());
    const sanitised = raw.replace(/("Authorization":\s?)".*?"/i, '$1"REDACTED"');
    return JSON.parse(sanitised);
  }

  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
};

export const logError = (
  event: string,
  error: any,
  metadata?: string | Record<string, unknown>,
) => {
  const data = typeof metadata === 'string' ? { message: metadata } : metadata;
  logEvent(event, { ...data, error: serialiseError(error) });
  newrelic.noticeError(error, { event });
};

export const createCancellablePromise = <T>(
  executor: (resolve: Resolver<T>, reject: Rejecter) => void,
) => {
  let cancel!: (reason: T, reject?: boolean) => void;

  const promise = new Promise<T>((resolve, reject) => {
    cancel = (reason, shouldReject) => {
      if (shouldReject) reject(reason);
      else resolve(reason);
    };

    executor(resolve, reject);
  });

  return { promise, cancel };
};

export const sleep = (t = 1000) => new Promise((resolve) => setTimeout(resolve, t));

export const tryReadFile = async (filepath: string): Promise<string | null> => {
  try {
    const result = await fs.readFile(filepath);
    return result.toString();
  } catch (error) {
    if (isMatching({ code: 'ENOENT' })) {
      return null;
    }

    logError('tryReadFile', error, { filepath });
    return null;
  }
};

export const tryParseJSON = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    logError('tryParseJSON', error, { raw });
    return null;
  }
};

export const trimToJsonObject = (raw: string) => {
  const startIndex = raw.indexOf('{');
  const endIndex = raw.lastIndexOf('}');
  return raw.slice(startIndex, endIndex + 1);
};

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/\s{1,}/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '');

export const timeParts = (duration: number) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  return { hours, minutes, seconds };
};

export const secToISOTime = (duration: number): string => {
  const { hours, minutes, seconds } = timeParts(duration);
  const fragments = [seconds, minutes];

  if (hours > 0) {
    fragments.push(hours);
  }

  return fragments
    .reverse()
    .map((val) => `${val}`.padStart(2, '0'))
    .join(':');
};

export const secToTimeFragments = (duration: number): string => {
  const { hours, minutes, seconds } = timeParts(duration);
  const fragments = [];

  if (hours > 0) {
    fragments.push(`${hours}h`);
  }

  if (minutes > 0) {
    fragments.push(`${minutes}m`);
  }

  if (seconds > 0) {
    fragments.push(`${seconds}s`);
  }

  return fragments.join(' ');
};

type FirstParameter<F extends (...args: any[]) => any> = F extends (
  first: infer First,
  ...args: any
) => any
  ? First
  : never;

type RestParameters<F extends (...args: any[]) => any> = F extends (
  first: any,
  ...args: infer Rest
) => any
  ? Rest
  : never;

export const curry =
  <F extends (...args: any[]) => any>(fn: F) =>
  (first: FirstParameter<F>) =>
  <Result = ReturnType<F>>(...args: RestParameters<F>): Result =>
    fn(first, ...args);

type LastElement<T extends any[]> = T extends [...any, infer Last] ? Last : never;

type RestLastElement<T extends any[]> = T extends [...infer Rest, any] ? Rest : never;

export const curryLast =
  <F extends (...args: any[]) => any>(fn: F) =>
  (...args: RestLastElement<Parameters<F>>) =>
  <Result = ReturnType<F>>(last: LastElement<Parameters<F>>): Result =>
    fn(...args, last);

export const encodeUriParams = (params: Record<string, string>) =>
  Object.entries(params)
    .map((pair) => pair.map(encodeURIComponent).join('='))
    .join('&');

export const readStream = <T = Buffer>(stream: internal.Readable): Promise<T[]> => {
  const data: T[] = [];
  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('end', () => resolve(data));
    stream.on('data', (chunk) => data.push(chunk));
  });
};

export const collect = <K, V, F extends unknown[] = []>(collector: Collector<K, V, F>) =>
  new Promise<Collection<K, V>>((resolve) => {
    collector.once('end', resolve);
  });

export const obscure = (input: string) => input.slice(0, 4) + input.slice(4).replace(/./g, '*');

export const encodeQueryParams = (params: Record<string, any>) =>
  Object.entries(params)
    .map((pair) => pair.map(encodeURIComponent).join('='))
    .join('&');
