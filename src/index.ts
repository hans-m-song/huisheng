import 'source-map-support/register';
import 'dotenv/config';
import { initialize } from './Bot';
import { logEvent } from './utils';

(async () => {
  const { promise } = await initialize();
  const reason = await promise;
  console.log();
  logEvent('exit', 'reason:', `"${reason}"`);
  process.exit();
})();
