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
import { Cache } from '../lib/Cache';

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

Cache.migrate();
server.listen({ port: 8000 });
console.log(process.env.NODE_ENV);
