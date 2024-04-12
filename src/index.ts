import 'source-map-support/register';
import 'dotenv/config';
import 'newrelic';

import { promises as fs } from 'fs';
import { setTimeout } from 'timers/promises';

import { Bot } from './Bot';
import { config } from './config';
import { dependencyReport } from './lib/audio';
import { Bucket } from './lib/Bucket';
import { logEvent } from './lib/utils';

(async () => {
  logEvent('init', { report: dependencyReport() });
  await fs.mkdir(config.cacheDir, { recursive: true });
  await Bucket.ping();
  const bot = new Bot();
  await bot.login();
  await setTimeout();
})();
