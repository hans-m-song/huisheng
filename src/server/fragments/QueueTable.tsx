import React from 'preact/compat';

import { Button } from './Button';
import { Link } from './Link';
import { Pagination } from './Pagination';
import { QueuedSong } from '../../lib/cache';
import { secToTimeFragments } from '../../lib/utils';
import { Trigger } from '../consts';

export interface QueueTableProps {
  channelId: string;
  items: QueuedSong[];
  limit: number;
  offset: number;
}

export const QueueTable = (props: QueueTableProps) => (
  <div
    class="QueueTable"
    hx-trigger={`${Trigger.Queue} from:body`}
    hx-get={`/hx/queue/${props.channelId}?limit=${props.limit}&offset=${props.offset}`}
  >
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Thumbnail</th>
          <th>Song</th>
          <th>Artist</th>
          <th>Duration</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {props.items.map((item) => (
          <tr class={`QueueTable-${item.sortOrder}`}>
            <td>
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.songTitle} style={{ maxHeight: '60px' }} />
              ) : (
                'N/A'
              )}
            </td>
            <td>
              <Link href={item.songUrl} text={item.songTitle} external />
            </td>
            <td>
              <Link href={item.artistUrl} text={item.artistTitle} external />
            </td>
            <td>{item.duration !== null ? secToTimeFragments(item.duration) : '?'}</td>
            <td>
              <Button
                class="btn-sm"
                hx-delete={`/hx/queue/${props.channelId}/${item.sortOrder}`}
                hx-target={`.QueueTable-${item.sortOrder}`}
              >
                <i class="bi bi-trash" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <Pagination
      path={`/hx/queue/${props.channelId}`}
      target=".QueueTable"
      count={props.items.length}
      limit={props.limit}
      offset={props.offset}
    />
  </div>
);
