import React from 'preact/compat';

import { SongSearchForm } from '../fragments/SongSearchForm';

export interface QueueProps {
  channelId: string;
}

export const Queue = (props: QueueProps) => (
  <div class="Queue vstack gap-3 p-3">
    <h4>Queue</h4>

    <SongSearchForm channelId={props.channelId} />

    <div hx-trigger="load" hx-get={`/hx/queue/${props.channelId}`} />
  </div>
);
