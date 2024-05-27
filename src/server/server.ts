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
      'img-src': ["'self'", 'https://i.ytimg.com'],
    },
  },
});

server.register(fastifyStatic, {
  prefix: '/static',
  root: path.join(__dirname, 'static'),
});
