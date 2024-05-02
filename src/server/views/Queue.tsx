import React from 'preact/compat';

import { SongForm } from '../components/SongForm';

export const Queue = () => (
  <div class="Queue">
    <div class="vstack gap-3">
      <SongForm action="create" />
    </div>
    <div class="mx-3">
      <div hx-trigger="load" hx-get="/queue/items" />
    </div>
  </div>
);
