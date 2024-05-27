import { FastifyInstance } from 'fastify';
import plugin from 'fastify-plugin';
import { isValidElement } from 'preact';
import { render } from 'preact-render-to-string';

import { ContentType } from './consts';
import { Layout } from './views/Layout';

export const hooks = plugin(async (fastify: FastifyInstance) => {
  fastify.setReplySerializer((payload) => payload as any);

  fastify.addHook('preSerialization', async (request, reply, payload) => {
    if (!isValidElement(payload)) {
      return JSON.stringify(payload);
    }

    reply.type(ContentType.HTML);

    // htmx component request
    if (request.headers['hx-request'] === 'true') {
      return render(payload);
    }

    const { channelId } = request.params as any;

    // browser page request
    return '<!DOCTYPE html>' + render(Layout({ channelId, children: payload }));
  });
});
