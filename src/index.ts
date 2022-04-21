import 'dotenv/config';
import 'source-map-support/register';

import { generateDependencyReport } from '@discordjs/voice';
import { promises as fs } from 'fs';

import { initializeClient } from './Bot';
import { config } from './config';
import { destroyVoiceConnections } from './lib/Audio';
import { logEvent } from './lib/utils';

(async () => {
  logEvent('audio', '\n', generateDependencyReport());

  await fs.mkdir(config.cacheDir, { recursive: true });
  const { client, reason } = await initializeClient();

  console.log();
  logEvent('exit', { reason: await reason });

  destroyVoiceConnections();
  client.user?.setStatus('invisible');
  client.destroy();
  process.exit();
})();