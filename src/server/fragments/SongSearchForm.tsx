import { Button } from './Button';
import { Link } from './Link';
import { QueryResult } from '../../lib/Youtube';

export interface SongSearchFormProps {
  channelId?: string;
}

export const SongSearchForm = (props: SongSearchFormProps) => {
  const endpoint = props.channelId ? `/hx/songs/${props.channelId}/search` : `/hx/songs/search`;

  return (
    <div class="SongSearchForm vstack gap-3">
      <form hx-target=".SongSearchResultsTable" hx-post={endpoint}>
        <div class="hstack gap-3">
          <div class="form-floating col">
            <input
              class="form-control"
              type="search"
              aria-label="Search for a song"
              placeholder="Search for a song"
              id="SongSearchForm-query"
              name="query"
              hx-trigger="input changed delay:1000ms, search"
              hx-target=".SongSearchResultsTable"
              hx-post={endpoint}
              hx-sync="closest form:drop"
            />
            <label for="SongSearchForm-query">Search for a song</label>
          </div>
          <Button class="btn-primary" type="submit">
            Search
          </Button>
        </div>
      </form>
      <div class="SongSearchResultsTable" />
    </div>
  );
};

export interface SongSearchResultsTableProps {
  channelId?: string;
  items?: QueryResult[] | null;
}

export const SongSearchResultsTable = (props: SongSearchResultsTableProps) => {
  if (!props.items || props.items.length < 1) {
    return (
      <div class="SongSearchResultsTable">
        <i class="bi bi-binoculars" />
        No results found...
      </div>
    );
  }

  return (
    <table class="SongSearchResultsTable table table-striped">
      <thead>
        <tr>
          <td>Thumbnail</td>
          <td>Title</td>
          <td>Channel</td>
          {props.channelId && <td>{/* actions */}</td>}
        </tr>
      </thead>
      <tbody>
        {props.items.map((item) => (
          <tr>
            <td>
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} style={{ maxHeight: '60px' }} />
              ) : (
                'N/A'
              )}
            </td>
            <td>
              <Link
                href={`https://youtube.com/watch?v=${item.videoId}`}
                text={item.title}
                external
              />
            </td>
            <td>
              <Link
                href={`https://youtube.com/channel/${item.channelId}`}
                text={item.channelTitle}
                external
              />
            </td>
            {props.channelId && (
              <td class="text-end">
                <Button
                  class="btn-sm"
                  hx-post={`/hx/queue/${props.channelId}`}
                  hx-vals={JSON.stringify({ songId: item.videoId })}
                  hx-swap="none"
                >
                  <i class="bi bi-check" />
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
