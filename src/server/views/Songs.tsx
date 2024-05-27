import React from 'preact/compat';

import { SongSearchForm } from '../fragments/SongSearchForm';
import { SongForm } from '../fragments/SongForm';
import { Trigger } from '../consts';

export interface SongProps {
  channelId: string;
}

export const Songs = (props: SongProps) => (
  <div class="Songs vstack gap-3 p-3">
    <h4>Songs</h4>

    <ul class="nav nav-underline" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="Songs-SongSearchForm-tab"
          data-bs-toggle="tab"
          data-bs-target="#Songs-SongSearchForm-pane"
          type="button"
          role="tab"
          aria-controls="Songs-SongSearchForm-pane"
          aria-selected="true"
        >
          Search for a song
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="SongForm-tab"
          data-bs-toggle="tab"
          data-bs-target="#SongForm-pane"
          type="button"
          role="tab"
          aria-controls="SongForm-pane"
          aria-selected="false"
        >
          Manually create a song
        </button>
      </li>
    </ul>

    <div class="tab-content">
      <div
        class="tab-pane fade show active"
        id="Songs-SongSearchForm-pane"
        role="tabpanel"
        aria-labelledby="Songs-SongSearchForm-tab"
        tabindex={0}
      >
        <SongSearchForm channelId={props.channelId} />
      </div>
      <div
        class="tab-pane fade"
        id="SongForm-pane"
        role="tabpanel"
        aria-labelledby="SongForm-tab"
        tabindex={0}
      >
        <SongForm />
      </div>
    </div>

    <hr class="m-0" />

    <div hx-trigger={`load, ${Trigger.Songs} from:body`} hx-get={`/hx/songs/${props.channelId}`} />
  </div>
);
