import { createRequestHandler } from '@react-router/express';
import compression from 'compression';
import { log } from 'evlog';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createOriginalHostMiddleware } from './server/original-host.mjs';
import { createPrefetchGuardMiddleware } from './server/prefetch-guard.mjs';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';

export function createServerApp(build, mode = process.env.NODE_ENV) {
  const app = express();

  app.set('trust proxy', true);
  app.disable('x-powered-by');

  app.get('/healthz', (_req, res) => {
    res.status(200).type('text/plain').send('ok');
  });

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

  app.use(createOriginalHostMiddleware());
  app.use(createPrefetchGuardMiddleware());

  app.all(
    '/{*splat}',
    createRequestHandler({
      build,
      mode,
    }),
  );

  return app;
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const build = await import('./build/server/index.js');
  const app = createServerApp(build);

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
}
