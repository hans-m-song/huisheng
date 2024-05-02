import React, { HTMLAttributes } from 'preact/compat';

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export const Button = ({ text, children, ...buttonProps }: ButtonProps) => (
  <button class="btn btn-primary" {...buttonProps}>
    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    <span role="status">{text ?? children}</span>
  </button>
);
