import type { AddressInfo } from 'node:net';
import { describe, expect, it, vi } from 'vitest';

const mockRequestHandler = vi.fn((_req, res) => {
  res.status(200).send('react-router');
});

vi.mock('@react-router/express', () => ({
  createRequestHandler: vi.fn(() => mockRequestHandler),
}));

describe('createServerApp', () => {
  it('serves GET /healthz with 200 ok before invoking React Router', async () => {
    const { createServerApp } = await import('./server.js');
    const app = createServerApp({} as never, 'production');

    const server = await new Promise<ReturnType<typeof app.listen>>(
      (resolve) => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
      },
    );

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');
      expect(text).toBe('ok');
      expect(mockRequestHandler).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err?: Error) => (err ? reject(err) : resolve()));
      });
    }
  });
});
