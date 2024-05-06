import React from 'preact/compat';

import { SongForm } from '../fragments/SongForm';

export const Queue = () => (
  <div class="Queue vstack gap-3 p-3">
    <SongForm action="create" />
    {/* @todo dynamically fetch channels */}
    <div hx-trigger="load" hx-get="/queue/channel 1" />
  </div>
);
