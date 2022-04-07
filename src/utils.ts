import { Message } from 'discord.js';

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

export const logError = (event: string, error: any, ) =>
  logEvent(event, '[ERROR]', error);

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
