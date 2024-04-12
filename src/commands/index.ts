import { Routes } from 'discord-api-types/v10';
import { EmbedBuilder, REST, SlashCommandBuilder } from 'discord.js';

import { config } from '../config';
import { Command } from '../lib/Command';
import { logError, logEvent } from '../lib/utils';
import { clear } from './clear';
import { debug } from './debug';
import { gtfo } from './gtfo';
import { np } from './np';
import { pause } from './pause';
import { ping } from './ping';
import { play } from './play';
import { queue } from './queue';
import { remove } from './remove';
import { search } from './search';
import { shutdown } from './shutdown';
import { size } from './size';
import { skip } from './skip';
import { stop } from './stop';
import { summon } from './summon';

export const commands: Record<string, Command> = {
  clear,
  debug,
  gtfo,
  np,
  now: np,
  pause,
  ping,
  play,
  queue,
  remove,
  restart: shutdown,
  rm: remove,
  search,
  shutdown,
  skip,
  size,
  stop,
  summon,
};

commands.register = {
  spec: new SlashCommandBuilder().setName('register').setDescription('Register slash commands'),

  onMessage: async (_, message) => {
    if (!message.guildId) {
      await message.channel.send('Must be in a server to register slash commands');
      return;
    }

    await registerSlashCommands(message.guildId);
  },
};

commands.help = {
  spec: new SlashCommandBuilder().setName('help').setDescription('Display help'),

  onMessage: async (_, message) => {
    const channel = await message.author.createDM();

    const embed = new EmbedBuilder().setTitle('Available commands').setDescription(
      Object.values(commands)
        .map((command) => `\`${command.spec.name}\` - ${command.spec.description ?? 'N/A'}`)
        .join('\n'),
    );

    await channel.send({ embeds: [embed] });
  },
};

export const registerSlashCommands = async (guildId: string) => {
  const rest = new REST({ version: '10' }).setToken(config.botToken);

  const body = Object.values(commands)
    .filter((command) => !!command.onInteraction)
    .map((command) => command.spec.toJSON());
  const names = body.map((cmd) => cmd.name);

  if (body.length < 1) {
    logEvent('registerSlashCommands', {
      guildId,
      commands: names,
      status: 'skipped',
    });
    return;
  }

  try {
    await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body });
    logEvent('registerSlashCommands', {
      guildId,
      commands: names,
      status: 'success',
    });
  } catch (error) {
    logError('registerSlashCommands', error, {
      guildId,
      commands: names,
      status: 'failed',
      json: (error as any).requestBody.json,
      rawError: (error as any).rawError?.errors,
    });
  }
};
