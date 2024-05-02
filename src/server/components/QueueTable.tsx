import React from 'preact/compat';

import { QueuedSong } from '../../lib/Cache';

export interface QueueTableProps {
  items: QueuedSong[];
}

export const QueueTable = (props: QueueTableProps) => (
  <table id="QueueTable">
    <thead>
      <th>Sort Order</th>
      <th>Played</th>
      <th>Video Title</th>
      <th>Channel Title</th>
      <th>Duration</th>
      <th>{/* actions */}</th>
    </thead>
    <tbody>
      {props.items.map((item) => (
        <tr id={`QueueItem-${item.videoId}`}>
          <td>{item.sortOrder}</td>
          <td>{item.played}</td>
          <td>{item.videoTitle}</td>
          <td>{item.channelTitle}</td>
          <td>{item.duration}</td>
          <td>
            <button class="btn">
              <i class="bi bi-trash"></i> delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
