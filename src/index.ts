import 'source-map-support/register';
import 'dotenv/config';

import { generateDependencyReport, getVoiceConnection } from '@discordjs/voice';

import { initializeClient } from './Bot';
import { logEvent } from './utils';

(async () => {
  logEvent('voice', '\n', generateDependencyReport());

  const { client, reason } = await initializeClient();

  console.log();
  logEvent('exit', 'reason:', `"${await reason}"`);

  client.guilds.cache.forEach((guild) => {
    const connection = getVoiceConnection(guild.id);
    if (!connection) {
      return;
    }

    logEvent('audio', 'disconnecting from', guild.name);
    connection.destroy();
  });

  process.exit();
})();
