import { getVoiceConnection } from '@discordjs/voice';
import { Client, Intents } from 'discord.js';

import { messageHandler } from './commands';
import { config } from './config';
import { getPlayer } from './lib/Player';
import { createCancellablePromise, logError, logEvent } from './lib/utils';

const authorizeUrl
  = 'https://discord.com/api/oauth2/authorize?'
  + [
    `client_id=${config.clientId}`,
    `permissions=${process.env.DISCORD_BOT_PERMISSIONS ?? '3148864'}`,
    'scope=applications.commands%20bot',
  ].join('&');

export const initializeClient = async () => {
  const client = new Client({
    // Required for direct messages
    partials: [ 'CHANNEL' ],
    intents:  [
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_VOICE_STATES,
    ],
  });

  const { promise: reason } = exitPromise(client);
  client.on('error', (error) => logError('client', error));
  client.on('messageCreate', messageHandler(client));
  client.on('voiceStateUpdate', (oldState, newState) => {
    if (!client.user) {
      // client isn't ready for voice
      return;
    }

    if (oldState.channel && newState.channel) {
      // user did not join or leave
      return;
    }

    if (!oldState.channel && !newState.channel) {
      // wtf would have happened?
      return;
    }

    if (newState.channel) {
      // user joined
      logEvent('voiceState', { user: newState.member?.user.tag ?? '?', action: 'joined' });
      return;
    }

    if (oldState.channel) {
      // user left
      // was two members, including bot
      const self = oldState.channel?.members.get(client.user.id);
      const willDisconnect = self && oldState.channel?.members.size < 3;
      logEvent('voiceState', { user: oldState.member?.user.tag ?? '?', action: 'left', willDisconnect });
      getPlayer(oldState.channel.guild.id).instance.pause();
      getVoiceConnection(oldState.channel.guild.id)?.disconnect();
    }
  });

  const ready = new Promise<void>((resolve) => {
    client.once('ready', (client) => {
      logEvent('ready', `@${client.user.tag}, invite: ${authorizeUrl}`);
      client.user.setPresence({
        status:     'online',
        activities: [ { type: 'WATCHING' , name: 'Shrek 2' } ],
      });
      resolve();
    });
  });

  await Promise.all([ client.login(config.botToken), ready ]);

  return { client, reason };
};

const exitPromise = (client: Client<true>) =>
  createCancellablePromise<string>((resolve) => {
    process.once('SIGINT', () => {
      resolve('caught sigint');
    });

    process.once('SIGTERM', () => {
      resolve('caught sigterm');
    });

    client.once('invalidated', () => {
      resolve('session invalidated');
    });
  });
