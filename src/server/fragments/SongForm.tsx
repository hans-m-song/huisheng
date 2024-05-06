import React from 'preact/compat';

import { Button } from './Button';
import { Song } from '../../lib/cache';

export interface SongFormProps {
  song?: Partial<Song> | null;
}

export const SongForm = (props: SongFormProps) => (
  <form
    class="SongForm"
    hx-post="/songs/items"
    hx-indicator="#SongForm-submit"
    hx-disabled-elt="#SongForm-submit"
  >
    <div class="vstack gap-3">
      <div class="hstack gap-3">
        <div class="input-group">
          <label for="SongForm-input-songId" class="form-label">
            Song Id
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Song Id"
              name="songId"
              value={props.song?.songId ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-songTitle" class="form-label">
            Song Title
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Song Title"
              name="songTitle"
              value={props.song?.songTitle ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-songUrl" class="form-label">
            Song Url
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Song Url"
              name="songUrl"
              value={props.song?.songUrl ?? ''}
            />
          </div>
        </div>
      </div>
      <div class="hstack gap-3">
        <div class="input-group">
          <label for="SongForm-input-artistId" class="form-label">
            Artist Id
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Artist Id"
              name="artistId"
              value={props.song?.artistId ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-artistTitle" class="form-label">
            Artist Title
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Artist Title"
              name="artistTitle"
              value={props.song?.artistTitle ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-artistUrl" class="form-label">
            Artist Url
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Artist Url"
              name="artistUrl"
              value={props.song?.artistUrl ?? ''}
            />
          </div>
        </div>
      </div>
      <div class="hstack gap-3">
        <div class="input-group">
          <label for="SongForm-input-thumbnail" class="form-label">
            Thumbnail
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Duration"
              name="thumbnail"
              value={props.song?.thumbnail ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-duration" class="form-label">
            Duration
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Duration"
              name="duration"
              value={props.song?.duration ?? ''}
            />
          </div>
        </div>
      </div>
      <div>
        <Button
          id="SongForm-submit"
          type="submit"
          class="btn-primary"
          text={props.song ? 'edit' : 'create'}
        />
      </div>
    </div>
  </form>
);
