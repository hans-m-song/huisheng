import "dotenv/config";
import { Youtube } from "../src/lib/Youtube";

(async () => {
  const video = await Youtube.get("lYxE_whU9ak");
  console.log({
    thumbnail: video.items?.[0].snippet?.thumbnails?.default?.url,
    videoId: video.items?.[0].id,
    title: video.items?.[0].snippet?.title,
    channelId: video.items?.[0].snippet?.channelId,
    channelTitle: video.items?.[0].snippet?.channelTitle,
  });

  const playlist = await Youtube.list("PLWIol4T7LuSj4tNt8DvtHBE0c3UUiGGQ7");
  console.log(
    playlist.items?.map((item) => ({
      thumbnail: item.snippet?.thumbnails?.default?.url,
      videoId: item.snippet?.resourceId?.videoId,
      title: item.snippet?.title,
      channelId: item.snippet?.channelId,
      channelTitle: item.snippet?.channelTitle,
    })),
  );

  const search = await Youtube.search("deadmau5 xyz", 7);
  console.log(
    search.items?.map((item) => ({
      thumbnail: search.items?.[0].snippet?.thumbnails?.default?.url,
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      channelId: item.snippet?.channelId,
      channelTitle: item.snippet?.channelTitle,
    })),
  );
})();
