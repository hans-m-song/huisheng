import { getVoiceConnection } from '@discordjs/voice';
import { Awaitable, Client, ClientEvents, VoiceState } from 'discord.js';

import { trace } from '@opentelemetry/api';
import { commands } from './commands';
import { config, log } from './config';
import { emojiGetter } from './emotes';
import { getPlayer } from './lib/Player';
import { traceFn } from './lib/telemetry';

interface ClientEventHandler<K extends keyof ClientEvents> {
  (...args: ClientEvents[K]): Awaitable<void>;
}

export const onError: ClientEventHandler<'error'> = (error) =>
  log.error({ error }, 'discord.error');

const messageTracer = trace.getTracer('discord.message');
export const onMessageCreate =
  (client: Client): ClientEventHandler<'messageCreate'> =>
  async (message) => {
    if (message.author.bot || !message.content.startsWith(config.DISCORD_BOT_PREFIX)) {
      return;
    }

    const content = message.content.slice(config.DISCORD_BOT_PREFIX.length);
    log.info({
      event: 'discord.message',
      channel: (message.channel as any)?.name ?? message.channel.type,
      author: message.author.tag,
      content: message.content.slice(config.DISCORD_BOT_PREFIX.length),
    });
    const [command, ...args] = content.split(/\s{1,}/g);
    if (!commands[command]) {
      return;
    }

    const emoji = emojiGetter(client.emojis.cache);
    traceFn(messageTracer, `discord/message/${command}`, async (span) => {
      span.setAttributes({
        channel: (message.channel as any).name ?? 'unknown',
        author: message.author.tag,
        args: args.join(' '),
      });
      await commands[command].onMessage({ client, emoji }, message, args);
    });
  };

const interactionTracer = trace.getTracer('discord.interaction');
export const onInteractionCreate =
  (client: Client): ClientEventHandler<'interactionCreate'> =>
  async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    log.info({
      event: 'discord.interaction',
      channel: interaction.channel?.id ?? 'unknown',
      author: interaction.user.tag,
      content: interaction.commandName,
    });
    const command = commands[interaction.commandName].onInteraction;
    if (!command) {
      return;
    }

    const emoji = emojiGetter(client.emojis.cache);
    traceFn(interactionTracer, `discord/interaction/${interaction.commandName}`, async (span) => {
      span.setAttributes({
        channel: interaction.channel?.id ?? 'unknown',
        author: interaction.user.tag,
      });
      await command({ client, emoji }, interaction);
    });
  };

export const onVoiceStateUpdate =
  (client: Client): ClientEventHandler<'voiceStateUpdate'> =>
  (oldState: VoiceState, newState: VoiceState) => {
    if (
      // only when a voice connection exists
      !client.user ||
      // only when oldState.channel is defined
      newState.channel ||
      !oldState.channel
    ) {
      return;
    }

    const voiceMembers = oldState.channel.members.mapValues((member) => member.user.tag);
    const shouldLeave = voiceMembers.size === 1 && voiceMembers.has(client.user.id);
    log.info({
      event: 'discord.voiceState',
      user: oldState.member?.user.tag ?? '?',
      action: 'left',
      voiceMembers: voiceMembers.size,
      shouldLeave,
    });

    if (!shouldLeave) {
      return;
    }

    const connection = getVoiceConnection(oldState.channel.guild.id);
    if (!connection) {
      return;
    }

    try {
      const player = getPlayer(oldState.channel.guild.id);
      player.stop();
      player.playlist.clear();
      getVoiceConnection(oldState.channel.guild.id)?.disconnect();
    } catch (error) {
      log.error({
        event: 'discord.voiceStateUpdate',
        error,
        message: 'failed to disconnect from voice channel',
      });
    }
  };
