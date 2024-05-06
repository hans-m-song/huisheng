import React, { HTMLAttributes } from 'preact/compat';

export interface ButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'class'> {
  text?: string;
  class?: string;
}

export const Button = ({ text, children, ...buttonProps }: ButtonProps) => {
  const classNames = Array.from(new Set(`btn ${buttonProps.class ?? ''}`.split(/\s+/g)));

  return (
    <button {...buttonProps} class={classNames.join(' ')}>
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span role="status">{text ?? children}</span>
    </button>
  );
};
