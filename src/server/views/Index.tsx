import React from 'preact/compat';

export const Index = () => (
  <div class="Index vstack gap-3">
    <div hx-trigger="load" hx-get="/diagnostics"></div>
  </div>
);
