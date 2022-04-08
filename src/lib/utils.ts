import { Message } from 'discord.js';
import { promises as fs } from 'fs';
import { isMatching } from 'ts-pattern';

export type GuardType<T> = T extends (arg: any) => arg is infer G ? G : T

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

  const lower = typeof options.min === 'number'
    ? Math.max(options.min, parsed)
    : parsed;

  const upper = typeof options.max === 'number'
    ? Math.min(options.max, lower)
    : lower;

  return upper;
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

type Resolver<T> = (value: T | PromiseLike<T>) => void
type Rejecter = (reason: any) => void

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
