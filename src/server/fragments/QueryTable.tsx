import React from 'preact/compat';

import { Button } from './Button';
import { QueriedSong } from '../../lib/cache';

export interface QueryTableProps {
  items: QueriedSong[];
}

export const QueryTable = (props: QueryTableProps) => (
  <table class="QueryTable table table-striped">
    <thead>
      <th>Song</th>
      <th>Artist</th>
      <th>Hits</th>
      <th>Query</th>
      <th>Actions</th>
    </thead>
    <tbody>
      {props.items.map((item) => (
        <tr key={item.query}>
          <td>
            <a href={item.songUrl}>{item.songTitle}</a>
          </td>
          <td>
            {item.artistUrl ? <a href={item.artistUrl}>{item.artistTitle}</a> : item.artistTitle}
          </td>
          <td>{item.hits}</td>
          <td>{item.query}</td>
          <td>
            <Button class="btn-sm">
              <i class="bi bi-trash" />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
