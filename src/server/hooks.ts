import { FastifyInstance } from 'fastify';
import plugin from 'fastify-plugin';
import { isValidElement } from 'preact';
import { render } from 'preact-render-to-string';

import { ContentType, Header } from './consts';
import { Layout } from './views/Layout';

export const hooks = plugin(async (fastify: FastifyInstance) => {
  fastify.addHook('preSerialization', async (request, reply, payload) => {
    // requested by htmx
    const renderAsComponent = request.headers['hx-request'] === 'true';

    if (isValidElement(payload)) {
      reply.header(Header.ContentType, ContentType.HTML);
      const content = renderAsComponent
        ? render(payload)
        : '<!DOCTYPE html>\n' + render(Layout({ children: payload }));
      return { ___jsx: content };
    }

    reply.header(Header.ContentType, ContentType.JSON);
    return payload;
  });

  fastify.addHook('onSend', async (_, __, payload) => {
    if (typeof payload === 'string' && payload.startsWith(`{"___jsx":"`)) {
      return JSON.parse(payload).___jsx;
    }

    return payload;
  });
});
