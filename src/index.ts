import 'source-map-support/register';
import 'dotenv/config';
import 'newrelic';

import { generateDependencyReport } from '@discordjs/voice';
import { promises as fs } from 'fs';
import { setTimeout } from 'timers/promises';

import { Bot } from './Bot';
import { config } from './config';
import { Bucket } from './lib/Bucket';

(async () => {
  console.log(generateDependencyReport());

  await fs.mkdir(config.cacheDir, { recursive: true });
  await Bucket.ping();
  const bot = new Bot();
  await bot.login();

  await setTimeout();
})();
