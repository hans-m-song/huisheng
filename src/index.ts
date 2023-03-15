import 'source-map-support/register';
import 'dotenv/config';
import 'newrelic';

import { generateDependencyReport } from '@discordjs/voice';
import { promises as fs } from 'fs';

import { initializeClient } from './Bot';
import { config } from './config';
import { destroyVoiceConnections } from './lib/Audio';
import { Bucket } from './lib/Bucket';
import { createCancellablePromise, logEvent } from './lib/utils';

(async () => {
  console.log(generateDependencyReport());

  await fs.mkdir(config.cacheDir, { recursive: true });
  await Bucket.ping();
  const { client } = await initializeClient();

  const { promise, cancel } = createCancellablePromise<string>((resolve) => {
    client.once('invalidated', () => resolve('session invalidated'));
  });

  const reason = await promise;

  process.on('beforeExit', async () => {
    logEvent('exit', { reason });
    cancel('cancelled');
    destroyVoiceConnections();
    client.user?.setStatus('invisible');
    client.destroy();
  });
})();
