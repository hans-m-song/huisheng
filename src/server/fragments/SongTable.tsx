import React from 'preact/compat';

import { Button } from './Button';
import { Pagination } from './Pagination';
import { Song } from '../../lib/cache';
import { secToTimeFragments, slugify } from '../../lib/utils';
import { Trigger } from '../consts';
import { Link } from './Link';

export interface SongTableProps {
  channelId?: string;
  items: Song[];
  limit: number;
  offset: number;
}

export const SongTable = (props: SongTableProps) => {
  if (props.items.length < 1) {
    return (
      <div class="SongTable">
        <i class="bi bi-binoculars me-1" />
        No results found...
      </div>
    );
  }

  return (
    <div
      class="SongTable"
      hx-trigger={`${Trigger.Songs} from:body`}
      hx-get={`/hx/songs?limit=${props.limit}&offset=${props.offset}`}
    >
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Song</th>
            <th>Artist</th>
            <th>Duration</th>
            <th>Cached At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((item) => (
            <tr class={`SongTable-${slugify(item.songId)}`}>
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
              <td>{item.cachedAt ? new Date(item.cachedAt).toLocaleString() : '?'}</td>
              <td>
                {props.channelId && (
                  <Button
                    class="btn-sm"
                    hx-post={`/hx/queue/${props.channelId}`}
                    hx-vals={JSON.stringify({ songId: item.songId })}
                    hx-swap="none"
                  >
                    <i class="bi bi-plus-circle" />
                  </Button>
                )}
                <Button
                  class="btn-sm"
                  hx-get={`/hx/songs/${item.songId}/edit`}
                  hx-target=".SongForm"
                >
                  <i class="bi bi-pen" />
                </Button>
                <Button
                  class="btn-sm"
                  hx-delete={`/hx/songs/${item.songId}`}
                  hx-target={`.SongTable-${slugify(item.songId)}`}
                >
                  <i class="bi bi-trash" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        count={props.items.length}
        limit={props.limit}
        offset={props.offset}
        path={'/hx/songs'}
        target=".SongTable"
      />
    </div>
  );
};
