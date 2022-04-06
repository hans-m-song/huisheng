import { BaseGuildEmojiManager } from 'discord.js';

export enum Emoji {
  FeelsCarlosMan = 'FeelsCarlosMan',
}

export const emojiGetter = (cache: BaseGuildEmojiManager['cache']) =>
  (emoji: Emoji) =>
    cache.find(({ name }) => name === emoji)
      ?.toString() ?? '';
