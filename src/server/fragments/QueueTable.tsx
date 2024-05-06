import React from 'preact/compat';

import { Button } from './Button';
import { QueuedSong } from '../../lib/cache';
import { secToTimeFragments } from '../../lib/utils';

export interface QueueTableProps {
  items: QueuedSong[];
}

export const QueueTable = (props: QueueTableProps) => (
  <table class="QueueTable table table-striped">
    <thead>
      <tr>
        <th>Sort Order</th>
        <th>Song</th>
        <th>Artist</th>
        <th>Duration</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {props.items.map((item) => (
        <tr key={item.sortOrder}>
          <td>{item.sortOrder}</td>
          <td>
            <a href={item.songUrl}>{item.songTitle}</a>
          </td>
          <td>
            {item.artistUrl ? <a href={item.artistUrl}>{item.artistTitle}</a> : item.artistTitle}
          </td>
          <td>{item.duration !== null ? secToTimeFragments(item.duration) : '?'}</td>
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
