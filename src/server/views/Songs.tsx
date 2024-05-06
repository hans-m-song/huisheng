import React from 'preact/compat';

import { SongForm } from '../fragments/SongForm';

export const Songs = () => (
  <div class="Songs vstack gap-3 p-3">
    <SongForm action="create" />
    <div hx-trigger="load" hx-get="/songs/items" />
  </div>
);
