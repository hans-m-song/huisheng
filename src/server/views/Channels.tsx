export const Channels = () => (
  <div class="Channels vstack gap-3 p-3">
    <h4>Channels</h4>

    <div hx-trigger="load" hx-get="/hx/channels" />
  </div>
);
