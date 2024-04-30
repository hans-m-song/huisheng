import 'source-map-support/register';
import 'dotenv/config';
import 'newrelic';

import { promises as fs } from 'fs';

import { Bot } from './Bot';
import { config, log } from './config';
import { dependencyReport } from './lib/audio';
import { Bucket } from './lib/Bucket';
import { Cache } from './lib/Cache';

(async () => {
  log.info({ event: 'init', report: dependencyReport() });

  const bot = new Bot();
  await Promise.all([
    fs.mkdir(config.cacheDir, { recursive: true }),
    Cache.migrate(),
    Bucket.ping(),
    bot.login(),
  ]);

  await new Promise<void>((resolve) => {
    ['SIGINT', 'SIGTERM'].forEach((code) => {
      process.on(code, async (exitCode) => {
        log.info({ event: 'Bot.shutdown', message: 'client shutting down', exitCode });
        await bot.shutdown();
        resolve();
      });
    });
  });
})();
