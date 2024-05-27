export interface Paginationprops {
  path: string;
  count: number;
  limit: number;
  offset: number;
  target: string;
}

export const Pagination = (props: Paginationprops) => {
  const sep = props.path.includes('?') ? '&' : '?';
  const base = `${props.path}${sep}limit=${props.limit}&`;
  const prev = `${base}offset=${props.offset - props.limit}`;
  const next = `${base}offset=${props.offset + props.limit}`;

  const pages =
    props.offset > props.limit
      ? Array(props.offset / props.limit)
          .fill(0)
          .map((_, i) => `${base}offset=${i * props.limit}`)
      : [];

  return (
    <nav aria-label="navigation">
      <ul class="pagination justify-content-center">
        <li class={`page-item ${props.offset < 1 ? 'disabled' : ''}`}>
          <a hx-get={prev} hx-target={props.target} class="page-link" href="#">
            <i class="bi bi-arrow-left" />
          </a>
        </li>
        {pages.map((href, i) => (
          <li class="page-item">
            <a hx-get={href} hx-target={props.target} class="page-link" href="#">
              {i + 1}
            </a>
          </li>
        ))}
        <li class={`page-item ${props.count < props.limit ? 'disabled' : ''}`}>
          <a hx-get={next} hx-target={props.target} class="page-link" href="#">
            <i class="bi bi-arrow-right" />
          </a>
        </li>
      </ul>
    </nav>
  );
};
