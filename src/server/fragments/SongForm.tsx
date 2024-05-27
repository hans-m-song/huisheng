import React from 'preact/compat';

import { Button } from './Button';
import { Song } from '../../lib/cache';

export interface SongFormProps {
  song?: Partial<Song> | null;
}

export const SongForm = (props: SongFormProps) => (
  <form
    class="SongForm"
    hx-post="/hx/songs"
    hx-indicator="#SongForm-submit"
    hx-disabled-elt="#SongForm-submit"
  >
    <div class="vstack gap-3">
      <div class="hstack gap-3">
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Song Id"
            placeholder="Song Id"
            id="SongForm-input-songId"
            name="songId"
            value={props.song?.songId ?? ''}
          />
          <label for="SongForm-input-songId">Song Id</label>
        </div>
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Song Title"
            placeholder="Song Title"
            id="SongForm-input-songTitle"
            name="songTitle"
            value={props.song?.songTitle ?? ''}
          />
          <label for="SongForm-input-songTitle">Song Title</label>
        </div>
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Song Url"
            placeholder="Song Url"
            id="SongForm-input-songUrl"
            name="songUrl"
            value={props.song?.songUrl ?? ''}
          />
          <label for="SongForm-input-songUrl">Song Url</label>
        </div>
      </div>
      <div class="hstack gap-3">
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Artist Id"
            placeholder="Artist Id"
            id="SongForm-input-artistId"
            name="artistId"
            value={props.song?.artistId ?? ''}
          />
          <label for="SongForm-input-artistId">Artist Id</label>
        </div>
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Artist Title"
            placeholder="Artist Title"
            id="SongForm-input-artistTitle"
            name="artistTitle"
            value={props.song?.artistTitle ?? ''}
          />
          <label for="SongForm-input-artistTitle">Artist Title</label>
        </div>
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Artist Url"
            placeholder="Artist Url"
            id="SongForm-input-artistUrl"
            name="artistUrl"
            value={props.song?.artistUrl ?? ''}
          />
          <label for="SongForm-input-artistUrl">Artist Url</label>
        </div>
      </div>
      <div class="hstack gap-3">
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Duration"
            placeholder="Duration"
            id="SongForm-input-thumbnail"
            name="thumbnail"
            value={props.song?.thumbnail ?? ''}
          />
          <label for="SongForm-input-thumbnail">Thumbnail</label>
        </div>
        <div class="form-floating col">
          <input
            class="form-control"
            type="text"
            aria-label="Duration"
            placeholder="Duration"
            id="SongForm-input-duration"
            name="duration"
            value={props.song?.duration ?? ''}
          />
          <label for="SongForm-input-duration">Duration</label>
        </div>
      </div>
      {/* <div>
        <input class="form-control" name="file" type="file" id="SongForm-input-file" />
      </div> */}
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
