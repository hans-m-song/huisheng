import { getVoiceConnections } from '@discordjs/voice';
import { FastifyInstance } from 'fastify';
import React from 'preact/compat';
import { promisify } from 'util';

import { Diagnostics } from './components/Diagnostics';
import { ErrorSurface } from './components/ErrorSurface';
import { QueryTable } from './components/QueryTable';
import { QueueTable } from './components/QueueTable';
import { SongForm } from './components/SongForm';
import { SongTable } from './components/SongTable';
import { Status } from './consts';
import { Index } from './views/Index';
import { Queue } from './views/Queue';
import { Search } from './views/Search';
import { Songs } from './views/Songs';
import { Cache } from '../lib/Cache';
import { version } from '../lib/Downloader';

const attempt = <T,>(promise: Promise<T>) =>
  promise
    .then((data) => ({ ok: true, data } as const))
    .catch((error) => ({ ok: false, error } as const));

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

  app.get('/queue', async () => <Queue />);

  app.get('/queue/items', async (_, reply) => {
    const result = await attempt(Cache.listQueue());
    if (!result.ok) {
      reply.statusCode = Status.Error;
      return <ErrorSurface error={result.error} />;
    }

    return <QueueTable items={result.data} />;
  });

  app.post('/queue/items', async () => <>enqueue</>);

  app.delete('/queue/items/:sortOrder', async () => <>dequeue</>);

  app.post('/queue/items/next', async () => <>dequeue</>);

  app.get('/search', async () => <Search />);

  app.post('/search', async () => <>start a search</>);

  app.get('/songs', async () => <Songs />);

  app.get('/songs/items', async (_, reply) => {
    const result = await attempt(Cache.listSongs());
    if (!result.ok) {
      reply.statusCode = Status.Error;
      return <ErrorSurface error={result.error} />;
    }

    return <SongTable items={result.data} />;
  });

  app.post('/songs/items', async (request) => {
    app.log.info({ body: request.body });
    await promisify(setTimeout)(2000);
    // const result = await attempt(Cache.setSongs([]));

    // if (!result.ok) {
    //   replyError(request, reply, result.error);
    // }

    return <SongForm action="create" />;
  });

  app.get('/songs/queue', async () => <>in-progress downloads</>);

  app.delete('/songs/:songId', async () => <>delete song</>);

  app.get('/queries', async (_, reply) => {
    const result = await attempt(Cache.listQueries());
    if (!result.ok) {
      reply.statusCode = Status.Error;
      return <ErrorSurface error={result.error} />;
    }

    return <QueryTable items={result.data} />;
  });

  app.delete('/queries/:queryId', async () => <>delete search</>);
};
