import { createRequestHandler } from '@react-router/express';
import compression from 'compression';
import { log } from 'evlog';
import express from 'express';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';

const build = await import('./build/server/index.js');

const app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(compression());

app.use(
  '/assets',
  express.static('build/client/assets', {
    immutable: true,
    maxAge: '1y',
  }),
);
app.use(express.static('build/client', { maxAge: '1h' }));
app.use(express.static('public', { maxAge: '1h' }));

app.all(
  '/{*splat}',
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  }),
);

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, () => {
  log.info({
    action: 'server.start',
    message: `Server listening on http://${host}:${port}`,
    host,
    port,
  });
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    server.close((error) => {
      if (error) {
        log.error({
          action: 'server.close',
          message: 'Error closing server',
          error: error.message,
        });
      }
    });
  });
}
