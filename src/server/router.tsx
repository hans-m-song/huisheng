import { getVoiceConnections } from '@discordjs/voice';
import { FastifyInstance } from 'fastify';
import React from 'preact/compat';
import { render } from 'preact-render-to-string';

import { ContentType } from './consts';
import { Diagnostics } from './fragments/Diagnostics';
import { ErrorSurface } from './fragments/ErrorSurface';
import { QueryTable } from './fragments/QueryTable';
import { QueueTable } from './fragments/QueueTable';
import { SongForm } from './fragments/SongForm';
import { SongTable } from './fragments/SongTable';
import { Index } from './views/Index';
import { Layout } from './views/Layout';
import { Queue } from './views/Queue';
import { Search } from './views/Search';
import { Songs } from './views/Songs';
import { QueryDAO, QueueDAO, SongDAO } from '../lib/cache';
import { Pagination } from '../lib/cache/database';
import { version } from '../lib/Downloader';

export const router = async (app: FastifyInstance) => {
  app.get('/', async () => <Index />);

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

  app.get('/queue', async () => {
    return <Queue />;
  });

  app.get('/queue/:channelId', async (request) => {
    const { channelId } = request.params as any;
    const pagination = Pagination.fromAny(request.query);
    return <QueueTable items={await QueueDAO.list(channelId, pagination)} />;
  });

  app.post('/queue/:channelId', async () => <>enqueue</>);

  app.delete('/queue/:channelId/:sortOrder', async () => <>dequeue</>);

  app.post('/queue/:channelId/next', async () => <>dequeue</>);

  app.get('/search', async () => <Search />);

  app.post('/search', async () => <>start a search</>);

  app.get('/songs', async () => <Songs />);

  app.get('/songs/items', async (request) => {
    const pagination = Pagination.fromAny(request.query);
    return <SongTable items={await SongDAO.list(pagination)} {...pagination} />;
  });

  app.post('/songs/items', async (request, reply) => {
    await SongDAO.put(request.body as any);
    reply.header('hx-trigger', 'songs:update');
    return <SongForm />;
  });

  app.get('/songs/queue', async () => <>in-progress downloads</>);

  app.get('/songs/items/:songId', async (request) => {
    const { songId } = request.params as any;
    const song = await SongDAO.get(songId);
    return <SongForm song={song} />;
  });

  app.delete('/songs/items/:songId', async (request) => {
    const { songId } = request.params as any;
    const pagination = Pagination.fromAny(request.query);
    await SongDAO.delete(songId);
    return <SongTable items={await SongDAO.list(pagination)} {...pagination} />;
  });

  app.get('/queries', async (request) => {
    const pagination = Pagination.fromAny(request.query);
    return <QueryTable items={await QueryDAO.list(pagination)} />;
  });

  app.delete('/queries/:queryId', async () => <>delete query</>);

  app.setErrorHandler((error, request, reply) => {
    const hxRequest = request.headers['hx-request'] === 'true';
    const hxCurrentUrl = request.headers['hx-current-url'] as any;
    app.log.error({ err: error, reqId: request.id }, 'request errored');
    reply
      .code(200)
      .type(ContentType.HTML)
      .send(
        render(
          hxRequest ? (
            <ErrorSurface error={error} refresh={hxCurrentUrl} />
          ) : (
            <Layout>
              <ErrorSurface error={error} refresh={hxCurrentUrl} />
            </Layout>
          ),
        ),
      );
  });
};
