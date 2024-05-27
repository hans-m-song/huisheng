import { getVoiceConnections } from '@discordjs/voice';
import { FastifyInstance } from 'fastify';
import React from 'preact/compat';
import { render } from 'preact-render-to-string';

import { ContentType, Header, Trigger } from './consts';
import { Diagnostics } from './fragments/Diagnostics';
import { ErrorSurface } from './fragments/ErrorSurface';
import { QueueTable } from './fragments/QueueTable';
import { SongForm } from './fragments/SongForm';
import { SongSearchResultsTable } from './fragments/SongSearchForm';
import { SongTable } from './fragments/SongTable';
import { Layout } from './views/Layout';
import { Queue } from './views/Queue';
import { Songs } from './views/Songs';
import { QueueDAO, SongDAO, SongSchema } from '../lib/cache';
import { Pagination } from '../lib/cache/database';
import { version } from '../lib/Downloader';
import { Youtube } from '../lib/Youtube';
import { Channels } from './views/Channels';
import { ChannelList } from './fragments/ChannelList';

export const router = async (app: FastifyInstance) => {
  app.get('/', async (_, reply) => reply.redirect('/diagnostics'));

  app.get('/diagnostics', async () => {
    const ytdlVersion = await version().catch((error) => {
      app.log.error({ error }, 'failed to get ytdlp version');
      return null;
    });

    const connections = Array.from(getVoiceConnections().entries());
    const connectionsStatus =
      connections.length < 1
        ? 'none'
        : connections.map(([id, conn]) => `${id}: \`${conn.state.status}\``).join(', ');

    return <Diagnostics ytdlVersion={ytdlVersion} connectionsStatus={connectionsStatus} />;
  });

  app.get('/channels', async () => {
    return <Channels />;
  });

  app.get('/queue', async (_, reply) => reply.redirect('/channels'));

  app.get('/queue/:channelId', async (request) => {
    const { channelId } = request.params as any;
    return <Queue channelId={channelId} />;
  });

  app.get('/songs', async (_, reply) => reply.redirect('/channels'));

  app.get('/songs/:channelId', async (request) => {
    const { channelId } = request.params as any;
    return <Songs channelId={channelId} />;
  });

  app.get('/hx/channels', async () => {
    const items = await QueueDAO.listChannels();
    return <ChannelList items={items} />;
  });

  app.get('/hx/queue/:channelId', async (request) => {
    const { channelId } = request.params as any;
    const pagination = Pagination.fromAny(request.query);
    const items = await QueueDAO.list(channelId, pagination);
    return <QueueTable channelId={channelId} items={items} {...pagination} />;
  });

  app.post('/hx/queue/:channelId', async (request, reply) => {
    const { channelId } = request.params as any;
    const { songId } = request.body as any;
    await QueueDAO.enqueue(channelId, songId);
    reply.header(Header.HXTrigger, Trigger.Queue);
    return '';
  });

  app.delete('/hx/queue/:channelId/:sortOrder', async (request) => {
    const { channelId, sortOrder } = request.params as any;
    await QueueDAO.delete(channelId, sortOrder);
    return '';
  });

  // app.post("/hx/queue/:channelId/next", async (request) => {
  //   const { channelId } = request.params as any;
  //   return `dequeue ${channelId}`;
  // });

  app.get('/hx/songs', async (request) => {
    const pagination = Pagination.fromAny(request.query);
    const items = await SongDAO.list(pagination);
    return <SongTable items={items} {...pagination} />;
  });

  app.post('/hx/songs', async (request, reply) => {
    const pagination = Pagination.fromAny(request.query);
    const song = SongSchema.parse(request.body);
    await SongDAO.put(song);
    const items = await SongDAO.list(pagination);
    reply.header(Header.HXTrigger, Trigger.Songs);
    return <SongTable items={items} {...pagination} />;
  });

  app.post('/hx/songs/search', async (request) => {
    const { query } = request.body as any;
    const items = await Youtube.query(query, 5);
    return <SongSearchResultsTable items={items} />;
  });

  // TODO
  // app.get("/hx/songs/queue", async () => <>in-progress downloads</>);

  app.get('/hx/songs/:songId', async (request) => {
    const { songId } = request.params as any;
    const song = await SongDAO.get(songId);
    return <SongForm song={song} />;
  });

  app.delete('/hx/songs/:songId', async (request, reply) => {
    const { songId } = request.params as any;
    await SongDAO.delete(songId);
    reply.header(Header.HXTrigger, Trigger.Songs);
    return '';
  });

  app.setErrorHandler((error, request, reply) => {
    const hxRequest = request.headers['hx-request'] === 'true';
    const hxCurrentUrl = request.headers['hx-current-url'] as any;
    const { channelId } = request.params as any;
    app.log.error({ err: error, reqId: request.id }, 'request errored');
    reply
      .code(200)
      .type(ContentType.HTML)
      .send(
        render(
          hxRequest ? (
            <ErrorSurface error={error} refresh={hxCurrentUrl} />
          ) : (
            <Layout channelId={channelId}>
              <ErrorSurface error={error} refresh={hxCurrentUrl} />
            </Layout>
          ),
        ),
      );
  });
};
