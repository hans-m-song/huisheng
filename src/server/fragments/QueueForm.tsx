export interface QueueFormProps {
  channelId: string;
}

export const QueueForm = (props: QueueFormProps) => (
  <form
    class="QueueForm"
    hx-post={`/queue/${props.channelId}`}
    hx-indicator="#QueueForm-submit"
    hx-disabled-elt="#QueueForm-submit"
  >
    <div class="vstack gap-3">
      <div class="hstack gap-3">
        <div class="input-group">
          <label for="SongForm-input-songId" class="form-label">
            Song
          </label>
          <div class="input-group">
            <input
              class="form-control"
              type="search"
              aria-label="Song"
              name="songId"
              hx-trigger="#QueueForm-searchResults"
            />
          </div>
        </div>
      </div>
    </div>
  </form>
);
