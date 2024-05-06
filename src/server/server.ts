import 'source-map-support/register';
import 'dotenv/config';

import fastifyFormBody from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import fastify from 'fastify';
import path from 'path';

import { hooks } from './hooks';
import { router } from './router';
import { log } from '../config';
import { QueryDAO, QueueDAO, Song, SongDAO } from '../lib/cache';

export const server = fastify({ logger: log });
server.register(fastifyFormBody);
server.register(hooks);
server.register(router);

server.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      'script-src-elem': [
        "'self'",
        'https://unpkg.com/htmx.org@1.9.12',
        'https://cdn.jsdelivr.net',
      ],
    },
  },
});

server.register(fastifyStatic, {
  prefix: '/static',
  root: path.join(__dirname, 'static'),
});

// (async () => {
//   const songs: Song[] = Array(6)
//     .fill(0)
//     .map((_, i) => ({
//       songId: `song id ${i}`,
//       songTitle: `song title ${i}`,
//       songUrl: `https://example.com/song/${i}`,
//       artistId: `artist id ${i}`,
//       artistTitle: `artist title ${i}`,
//       artistUrl: `https://example.com/artist/${i}`,
//       thumbnail: `https://example.com/thumbnail/${i}`,
//       duration: i,
//       cachedAt: Date.now(),
//     }));
//   await SongDAO.put(...songs);
//   await QueryDAO.set('query 0', songs[0]);
//   await QueryDAO.search(songs[1].songTitle);
//   await QueueDAO.enqueue('channel 1', songs[0].songId);
//   server.listen({ port: 8000 });
// })();
