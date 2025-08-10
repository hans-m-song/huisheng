import 'dotenv/config';
import 'source-map-support/register';

import { promises as fs } from 'fs';

import { Bot } from './Bot';
import { config, log } from './config';
import { dependencyReport } from './lib/audio';
import { Bucket } from './lib/Bucket';
import { telemetrySdk } from './lib/telemetry';

(async () => {
  log.info({ event: 'init', report: dependencyReport(), config });

  telemetrySdk.start();

  await fs.mkdir(config.CACHE_DIR, { recursive: true });
  await Bucket.ping();
  const bot = new Bot();
  await bot.login();

  const shutdown = (resolve: () => void) => async (exitCode: number) => {
    await Promise.all([telemetrySdk.shutdown(), bot.shutdown(exitCode)]);
    resolve();
    process.exit(0);
  };

  await new Promise<void>((resolve) => {
    ['SIGINT', 'SIGTERM'].map((code) => {
      process.on(code, shutdown(resolve));
    });
  });
})();
