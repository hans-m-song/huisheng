import { Message } from 'discord.js';

export const logMessage = (message: Message) =>
  logEvent(
    'message',
    `#${(message.channel as any)?.name ?? message.channel.type}`,
    `@${message.author.tag}`,
    `"${message.content}"`
  );

export const logEvent = (event: string, ...args: unknown[]) => {
  console.log(`[${event}]`, ...args);
};
