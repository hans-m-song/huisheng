import React from 'preact/compat';

export const Index = () => (
  <div class="Index">
    <div class="About">
      <h4>About</h4>
      <i class="bi bi-github"></i>
    </div>
    <div class="Diagnostics">
      <div hx-trigger="load" hx-get="/diagnostics"></div>
    </div>
  </div>
);
