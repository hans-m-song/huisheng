import "dotenv/config";
import "source-map-support/register";
import { Song, SongDAO, QueueDAO } from "../src/lib/cache";
import { server } from "../src/server/server";
import { config } from "../src/config";

(async () => {
  const songs = [
    {
      thumbnail: "https://i.ytimg.com/vi/JUmpYJau5Vg/default.jpg",
      videoId: "JUmpYJau5Vg",
      title: "deadmau5 - XYZ",
      channelId: "UCYEK6xds6eo-3tr4xRdflmQ",
      channelTitle: "deadmau5",
    },
    {
      thumbnail: "https://i.ytimg.com/vi/JUmpYJau5Vg/default.jpg",
      videoId: "-xng12qdhDw",
      title: "deadmau5 - XYZ (NERO Remix)",
      channelId: "UCCbpTuRINyfjtwFkjHuII1w",
      channelTitle: "mau5trap",
    },
    {
      thumbnail: "https://i.ytimg.com/vi/JUmpYJau5Vg/default.jpg",
      videoId: "N22HHpbYE88",
      title: "deadmau5 - XYZ",
      channelId: "UCeuT6VsBplPygtAgJ2Wpeqw",
      channelTitle: "Obsessive Progressive",
    },
    {
      thumbnail: "https://i.ytimg.com/vi/JUmpYJau5Vg/default.jpg",
      videoId: "RSeqqi9-LQM",
      title: "Deadmau5 XYZ Extended",
      channelId: "UCXMF0L-H7_hbhvW6i4eAOBQ",
      channelTitle: "Hubie Fix",
    },
    {
      thumbnail: "https://i.ytimg.com/vi/JUmpYJau5Vg/default.jpg",
      videoId: "pgZ0Ja5o3hc",
      title: "XYZ – deadmau5 (Twitch live vers.) [No Mastering]",
      channelId: "UCCpLIH3yIf7JYOwMalcsYRA",
      channelTitle: "PotatoBadBoy",
    },
    {
      thumbnail: "https://i.ytimg.com/vi/JUmpYJau5Vg/default.jpg",
      videoId: "p_SpHwMsTWU",
      title: "deadmau5 - XYZ (NERO Remix)",
      channelId: "UC9UTBXS_XpBCUIcOG7fwM8A",
      channelTitle: "UKF",
    },
    {
      thumbnail: "https://i.ytimg.com/vi/JUmpYJau5Vg/default.jpg",
      videoId: "EH0nM5GiK6o",
      title: "deadmau5 - XYZ (NERO Remix)",
      channelId: "UC3ifTl5zKiCAhHIBQYcaTeg",
      channelTitle: "Proximity",
    },
  ].map(
    (raw, i): Song => ({
      artistId: raw.channelId,
      artistTitle: raw.channelTitle,
      cachedAt: Date.now(),
      artistUrl: `https://youtube.com/channel/${raw.channelId}`,
      duration: i + 60,
      songId: raw.videoId,
      songTitle: raw.title,
      songUrl: `https://youtube.com/watch?v=${raw.videoId}`,
      thumbnail: raw.thumbnail,
    }),
  );
  await SongDAO.put(...songs);
  await QueueDAO.enqueue("test", songs[0].songId);
  await SongDAO.list();
  server.listen({ port: config.webPort });
})();
