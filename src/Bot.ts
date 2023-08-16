import { ActivityType, Client, GatewayIntentBits, Partials } from 'discord.js';

import { config } from './config';
import { onMessageCreate, onInteractionCreate, onError, onVoiceStateUpdate } from './events';
import { destroyVoiceConnections } from './lib/Audio';
import { logEvent } from './lib/utils';

const authorizeUrl =
  'https://discord.com/api/oauth2/authorize?' +
  [
    `client_id=${config.clientId}`,
    `permissions=${process.env.DISCORD_BOT_PERMISSIONS ?? '3148864'}`,
    `scope=${encodeURIComponent(['applications.commands', 'bot'].join('&'))}`,
  ].join('&');

export class Bot {
  client: Client;

  constructor() {
    this.client = new Client({
      // Required for direct messages
      partials: [Partials.Channel],
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.on('error', onError);
    this.client.on('messageCreate', onMessageCreate(this.client));
    this.client.on('interactionCreate', onInteractionCreate(this.client));
    this.client.on('voiceStateUpdate', onVoiceStateUpdate(this.client));
    this.client.once('invalidated', this.shutdown.bind(this));
    process.on('beforeExit', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
  }

  async login() {
    const ready = new Promise<void>((resolve) => {
      this.client.once('ready', (client) => {
        client.user.setPresence({
          status: 'online',
          activities: [{ type: ActivityType.Watching, name: 'Shrek 2' }],
        });
        resolve();
      });
    });

    await Promise.all([this.client.login(config.botToken), ready]);
    logEvent('Bot.login.ready', { client: this.client.user?.tag, invite: authorizeUrl });
  }

  async shutdown(exitCode?: number | string) {
    logEvent('Bot.shutdown', { message: 'client shutting down', exitCode });
    destroyVoiceConnections();
    this.client.user?.setStatus('invisible');
    this.client.destroy();
    process.exit(typeof exitCode === 'number' ? exitCode : 1);
  }
}
