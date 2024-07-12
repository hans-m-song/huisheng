import {
  ChatInputCommandInteraction,
  Client,
  GuildEmoji,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export interface CommandContext {
  client: Client;
  emoji: (name: string) => string | GuildEmoji;
}

export interface OnMessageCallback {
  (context: CommandContext, message: Message, args: string[]): Promise<void>;
}

export interface OnInteractionCallback {
  (context: CommandContext, interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface Command {
  spec: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  onInteraction?: OnInteractionCallback;
  onMessage: OnMessageCallback;
}
