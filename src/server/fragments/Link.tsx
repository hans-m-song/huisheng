export interface LinkProps {
  href?: string | null;
  text?: string | null;
  external?: boolean;
}

export const Link = (props: LinkProps) => (
  <a class="icon-link icon-link-hover align-items-baseline" href={props.href ?? '#'}>
    {props.text}
    {props.external ? <i class="bi bi-box-arrow-up-right" /> : <i class="bi bi-arrow-right" />}
  </a>
);
