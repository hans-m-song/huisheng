import React from 'preact/compat';

import { Button } from './Button';
import { Song } from '../../lib/Cache';

export interface SongTableProps {
  items: Song[];
}

export const SongTable = (props: SongTableProps) => (
  <table id="SongTable">
    <thead>
      <th>Sort Order</th>
      <th>Played</th>
      <th>Video Title</th>
      <th>Channel Title</th>
      <th>Duration</th>
      <th>Cached At</th>
      <th>{/* actions */}</th>
    </thead>
    <tbody>
      {props.items.map((item) => (
        <tr id={`QueueItem-${item.videoId}`}>
          <td>{item.videoTitle}</td>
          <td>{item.channelTitle}</td>
          <td>{item.duration}</td>
          <td>{new Date(item.cachedAt).toLocaleString()}</td>
          <td>
            <Button class="btn-sm">
              <i class="bi bi-trash"></i>
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
