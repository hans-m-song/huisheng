import { generateDependencyReport } from '@discordjs/voice';

import 'dotenv/config';
import 'source-map-support/register';
import { destroyVoiceConnections } from './Audio';
import { initializeClient } from './Bot';
import { logEvent } from './utils';

(async () => {
  logEvent('audio', '\n', generateDependencyReport());

  const { client, reason } = await initializeClient();

  console.log();
  logEvent('exit', 'reason:', `"${await reason}"`);

  destroyVoiceConnections();
  client.destroy();
  process.exit();
})();
