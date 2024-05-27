export interface ChannelListProps {
  items: { channelId: string }[];
}

export const ChannelList = (props: ChannelListProps) => (
  <div class="ChannelList list-group">
    {props.items.map((item) => (
      <a class="list-group-item list-group-item-action" href={`/queue/${item.channelId}`}>
        {item.channelId}
      </a>
    ))}
  </div>
);
