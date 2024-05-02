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
import { Cache, Song } from '../lib/Cache';

export const server = fastify({
  logger: log,
});

server.register(fastifyFormBody);
server.register(hooks);
server.register(router);

server.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      'script-src': ["'self'"],
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
//   await Cache.migrate();
//   const song: Song = {
//     videoId: 'video id 1',
//     videoTitle: 'video title 1',
//     channelId: 'channel id 1',
//     channelTitle: 'channel title 1',
//     duration: 1,
//     cachedAt: Date.now(),
//   };
//   await Cache.setSongs([song]);
//   await Cache.setQuery('query 1', song);
// })();
server.listen({ port: 8000 });
