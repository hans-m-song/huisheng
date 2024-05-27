import { ActivityType, Client, GatewayIntentBits, Partials } from 'discord.js';

import { config, log } from './config';
import { onMessageCreate, onInteractionCreate, onError, onVoiceStateUpdate } from './events';
import { destroyVoiceConnections } from './lib/audio';

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
    log.info({ event: 'Bot.login.ready', client: this.client.user?.tag, invite: authorizeUrl });
  }

  async shutdown() {
    destroyVoiceConnections();
    this.client.user?.setStatus('invisible');
    this.client.destroy();
  }
}
