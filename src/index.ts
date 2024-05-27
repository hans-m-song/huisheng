import 'source-map-support/register';
import 'dotenv/config';
import 'newrelic';

import { promises as fs } from 'fs';

import { Bot } from './Bot';
import { config, log } from './config';
import { dependencyReport } from './lib/audio';
import { Bucket } from './lib/Bucket';
import { server } from './server/server';

(async () => {
  log.info({ event: 'init', report: dependencyReport() });

  const bot = new Bot();
  await Promise.all([fs.mkdir(config.cacheDir, { recursive: true }), Bucket.ping(), bot.login()]);
  server.listen({ port: config.webPort });

  await new Promise<void>((resolve) => {
    ['SIGINT', 'SIGTERM'].forEach((code) => {
      process.on(code, async (exitCode) => {
        log.info({ event: 'shutdown', message: 'client shutting down', exitCode });
        await Promise.all([bot.shutdown(), server.close()]);
        resolve();
      });
    });
  });
})();
