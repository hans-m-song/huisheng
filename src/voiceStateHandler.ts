import { Client, VoiceState } from 'discord.js';

import { logEvent } from './lib/utils';

export const voiceStateHandler =
  (client: Client) => (oldState: VoiceState, newState: VoiceState) => {
    if (!client.user) {
      // client isn't ready for voice
      return;
    }

    if (oldState.channel && newState.channel) {
      // user did not join or leave
      return;
    }

    if (!oldState.channel && !newState.channel) {
      // wtf would have happened?
      return;
    }

    if (newState.channel) {
      // user joined
      logEvent('voiceState', {
        user: newState.member?.user.tag ?? '?',
        action: 'joined',
      });
      return;
    }

    if (oldState.channel) {
      // user left
      const voiceMembers = oldState.channel.members.mapValues((member) => member.user.tag);
      const shouldLeave = voiceMembers.size === 1 && voiceMembers.has(client.user.id);
      logEvent('voiceState', {
        user: oldState.member?.user.tag ?? '?',
        action: 'left',
        voiceMembers: voiceMembers.size,
        shouldLeave,
      });
      // getPlayer(oldState.channel.guild.id).instance.pause();
      // getVoiceConnection(oldState.channel.guild.id)?.disconnect();
    }
  };
