import React from 'preact/compat';

import { serialiseError } from '../../lib/utils';

export interface ErrorSurfaceProps {
  error: any;
}

export const ErrorSurface = (props: ErrorSurfaceProps) => {
  const serialised = serialiseError(props.error);
  if (typeof serialised !== 'object') {
    return (
      <div class="ErrorSurface">
        <div>An error occurred</div>
        <div>{serialised}</div>
      </div>
    );
  }

  const stack = Array.isArray(serialised.stack)
    ? [serialised.stack[0], ...serialised.stack.slice(1).map((line: string) => '    ' + line)].join(
        '\n',
      )
    : serialised.stack;

  return (
    <div class="ErrorSurface">
      <div>An error occurred</div>
      {serialised.code && <div>{serialised.code}</div>}
      {serialised.message && <div>{serialised.message}</div>}
      {stack && <pre>{stack}</pre>}
    </div>
  );
};
