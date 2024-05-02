import React from 'preact/compat';

import { Button } from './Button';
import { Song } from '../../lib/Cache';

export interface SongFormProps {
  song?: Partial<Song>;
  action: 'create' | 'update';
}

export const SongForm = (props: SongFormProps) => (
  <form
    class="SongForm"
    hx-post="/api/song"
    hx-indicator="#SongForm-submit"
    hx-disabled-elt="#SongForm-submit"
    hx-swap="outerHTML"
  >
    <div class="vstack gap-3 m-3">
      <div class="hstack gap-3">
        <div class="input-group">
          <label for="SongForm-input-videoId" class="form-label">
            Video Id
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Video Id"
              id="SongForm-input-videoId"
              value={props.song?.videoId ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-videoTitle" class="form-label">
            Video Title
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Video Title"
              id="SongForm-input-videoTitle"
              value={props.song?.videoTitle ?? ''}
            />
          </div>
        </div>
      </div>
      <div class="hstack gap-3">
        <div class="input-group">
          <label for="SongForm-input-channelId" class="form-label">
            Channel Id
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Channel Id"
              id="SongForm-input-channelId"
              value={props.song?.channelId ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-channelTitle" class="form-label">
            Channel Tite
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Channel Tite"
              id="SongForm-input-channelTitle"
              value={props.song?.channelTitle ?? ''}
            />
          </div>
        </div>
      </div>
      <div class="hstack gap-3">
        <div class="input-group">
          <label for="SongForm-input-duration" class="form-label">
            Duration
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Duration"
              id="SongForm-input-duration"
              value={props.song?.duration ?? ''}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="SongForm-input-cachedAt" class="form-label">
            Cached At
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="text"
              aria-label="Cached At"
              id="SongForm-input-cachedAt"
              value={props.song?.cachedAt ?? ''}
            />
          </div>
        </div>
      </div>
      <div>
        <Button id="SongForm-submit" type="submit" text={props.action} />
      </div>
    </div>
  </form>
);
