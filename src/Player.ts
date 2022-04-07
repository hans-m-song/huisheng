import { createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice';

import { logError } from './utils';

export const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
player.on('error', (error) => logError('player', error));
