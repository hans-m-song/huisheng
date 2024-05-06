import React from 'preact/compat';

import { Button } from './Button';
import { Song } from '../../lib/cache';
import { secToTimeFragments } from '../../lib/utils';

export interface SongTableProps {
  items: Song[];
  limit: number;
  offset: number;
}

export const SongTable = (props: SongTableProps) => {
  const pagePrev = `/songs/items?limit=${props.limit}&offset=${props.offset - props.limit}`;
  const pageCurr = `/songs/items?limit=${props.limit}&offset=${props.offset}`;
  const pageNext = `/songs/items?limit=${props.limit}&offset=${props.offset + props.limit}`;
  const pages =
    props.offset > props.limit
      ? Array(props.offset / props.limit)
          .fill(0)
          .map((_, i) => `/sings/items?limit=${props.limit}&offset=${i * props.limit}`)
      : [];

  return (
    <div class="SongTable" hx-trigger="songs:update from:body" hx-get={pageCurr}>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Song</th>
            <th>Artist</th>
            <th>Duration</th>
            <th>Cached At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((item) => (
            <tr key={item.songId}>
              <td>
                <a href={item.songUrl}>{item.songTitle}</a>
              </td>
              <td>
                {item.artistUrl ? (
                  <a href={item.artistUrl}>{item.artistTitle}</a>
                ) : (
                  item.artistTitle
                )}
              </td>
              <td>{item.duration !== null ? secToTimeFragments(item.duration) : '?'}</td>
              <td>{new Date(item.cachedAt).toLocaleString()}</td>
              <td>
                <Button
                  class="btn-sm"
                  hx-delete={`/songs/items/${item.songId}`}
                  hx-target=".SongTable"
                >
                  <i class="bi bi-trash" />
                </Button>
                <Button class="btn-sm" hx-get={`/songs/items/${item.songId}`} hx-target=".SongForm">
                  <i class="bi bi-pen" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <nav aria-label="SongTable navigation">
        <ul class="pagination">
          <li class={`page-item ${!props.offset ? 'disabled' : ''}`}>
            <a hx-get={pagePrev} hx-target=".SongTable" class="page-link" href="#">
              Previous
            </a>
          </li>
          {pages.map((href, i) => (
            <li class="page-item">
              <a hx-get={href} hx-target=".SongTable" class="page-link" href="#">
                {i + 1}
              </a>
            </li>
          ))}
          <li class={`page-item ${props.items.length < props.limit ? 'disabled' : ''}`}>
            <a hx-get={pageNext} hx-target=".SongTable" class="page-link" href="#">
              Next
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};
