import React from 'preact/compat';

import { serialiseError } from '../../lib/utils';

export interface ErrorSurfaceProps {
  title?: string;
  error: any;
  refresh?: { target: string; path: string };
}

export const ErrorSurface = (props: ErrorSurfaceProps) => {
  const error = serialiseError(props.error);
  const title = props.title ?? 'An error occured';
  const message = error?.message ?? error;
  const code = error?.code ?? '';

  return (
    <div class="ErrorSurface vstack gap-3 p-3">
      <h4>{title}</h4>
      <p>
        {!message.includes(code) && `${code}: `}
        {message}
      </p>
      {props.refresh && (
        <div>
          <a hx-get={props.refresh.path} hx-target={props.refresh.target} class="btn btn-primary">
            Refresh
          </a>
        </div>
      )}
    </div>
  );
};