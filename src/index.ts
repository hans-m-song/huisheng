import 'source-map-support/register';
import 'dotenv/config';
import 'newrelic';

import { generateDependencyReport } from '@discordjs/voice';
import { promises as fs } from 'fs';

import { initializeClient } from './Bot';
import { config } from './config';
import { destroyVoiceConnections } from './lib/Audio';
import { Bucket } from './lib/Bucket';
import { logEvent } from './lib/utils';

(async () => {
  logEvent('audio', '\n', generateDependencyReport());

  await fs.mkdir(config.cacheDir, { recursive: true });
  await Bucket.ping();
  const { client, reason } = await initializeClient();

  logEvent('exit', { reason: await reason });
  destroyVoiceConnections();
  client.user?.setStatus('invisible');
  client.destroy();
  process.exit();
})();
