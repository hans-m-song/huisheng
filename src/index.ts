import 'source-map-support/register';
import 'dotenv/config';
import 'newrelic';

import { promises as fs } from 'fs';

import { Bot } from './Bot';
import { config, log } from './config';
import { dependencyReport } from './lib/audio';
import { Bucket } from './lib/Bucket';

(async () => {
  log.info({ event: 'init', report: dependencyReport() });
  await fs.mkdir(config.cacheDir, { recursive: true });
  await Bucket.ping();
  const bot = new Bot();
  await bot.login();

  await new Promise<void>((resolve) => {
    process.on('beforeExit', async (exitCode) => {
      await bot.shutdown(exitCode);
      resolve();
    });
  });
})();
