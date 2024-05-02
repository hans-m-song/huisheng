import React from 'preact/compat';

export const Search = () => (
  <div class="Search">
    <div hx-trigger="load" hx-get="/queries" />
  </div>
);
