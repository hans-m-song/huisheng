import { Message } from 'discord.js';
import { promises as fs } from 'fs';
import { isMatching } from 'ts-pattern';

export type GuardType<T> = T extends (arg: any) => arg is infer G ? G : T
export type Resolver<T> = (value: T | PromiseLike<T>) => void
export type Rejecter = (reason: any) => void

export const isNotNullish = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const clamp = (value: number, lower: number, upper: number) =>
  Math.max(lower, Math.min(upper, value));

export const numEnv = (
  value: string | undefined,
  options: {default: number, min?: number, max?: number}
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

export const logEvent = (event: string, ...args: unknown[]) => {
  console.log(`[${event}]`, ...args);
};

export const logMessage = (message: Message) =>
  logEvent(
    'message',
    `#${(message.channel as any)?.name ?? message.channel.type}`,
    `@${message.author.tag}`,
    `"${message.content}"`
  );

export const logError = (event: string, error: any, ...args: unknown[]) =>
  logEvent(event, '[ERROR]', ...args, '\n', error, );

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

export const tryReadFile = async (filepath: string): Promise<string | null> => {
  try {
    const result = await fs.readFile(filepath);
    return result.toString();
  } catch (error) {

    if (isMatching({ code: 'ENOENT' })) {
      return null;
    }

    logError('tryReadFile', error, filepath);
    return null;
  }
};

export const tryParseJSON = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    logError('tryParseJSON', error, raw);
    return null;
  }
};

export const slugify = (input: string) =>
  input.toLowerCase()
    .replace(/\s{1,}/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '');

export const secToMin = (duration?: number): string | undefined => {
  if (duration === undefined) {
    return duration;
  }

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return `${mins}m ${secs}s`;
};
