import React from 'preact/compat';

export const Songs = () => (
  <div class="Songs">
    <div hx-trigger="load" hx-get="/songs/items" />
  </div>
);
