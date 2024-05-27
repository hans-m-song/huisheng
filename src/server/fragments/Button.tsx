import React, { HTMLAttributes } from 'preact/compat';

export interface ButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'class'> {
  icon?: any;
  text?: string;
  class?: string;
}

export const Button = ({ icon, text, children, ...buttonProps }: ButtonProps) => {
  const classNames = Array.from(new Set(`btn ${buttonProps.class ?? ''}`.split(/\s+/g)));

  return (
    <button {...buttonProps} class={classNames.join(' ')}>
      <span class="spinner-border spinner-border-sm" aria-hidden="true" />
      {icon && <span class="pr-1">{icon}</span>}
      <span role="status">{text ?? children}</span>
    </button>
  );
};
