import React from 'preact/compat';

export const Search = () => (
  <div class="Search p-3">
    <div hx-trigger="load" hx-get="/queries" />
  </div>
);
