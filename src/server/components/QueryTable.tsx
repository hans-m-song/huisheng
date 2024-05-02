import React from 'preact/compat';

import { Button } from './Button';
import { QueriedSong } from '../../lib/Cache';

export interface QueryTableProps {
  items: QueriedSong[];
}

export const QueryTable = (props: QueryTableProps) => (
  <table id="QueryTable">
    <thead>
      <th>Video Title</th>
      <th>Channel Title</th>
      <th>Hits</th>
      <th>Query</th>
      <th>{/* actions */}</th>
    </thead>
    <tbody>
      {props.items.map((item) => (
        <tr id={`QueryItem-${item.query}`}>
          <td>{item.videoTitle}</td>
          <td>{item.channelTitle}</td>
          <td>{item.hits}</td>
          <td>{item.query}</td>
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
