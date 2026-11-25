import { describe, expect, it, vi } from 'vitest';

import { prefetchGuardMiddleware } from './prefetch-guard';

describe('prefetchGuardMiddleware', () => {
  it('returns 503 without invoking next for same-origin document prefetches', async () => {
    const next = vi.fn(async () => new Response('ok', { status: 200 }));
    const request = new Request(
      'https://d2onetrick.com/profile/u1/c/c1/loadouts',
      {
        method: 'GET',
        headers: {
          'sec-purpose': 'prefetch',
          'sec-fetch-dest': 'document',
          referer: 'https://d2onetrick.com/profile/u1/c/c1',
          host: 'd2onetrick.com',
        },
      },
    );

    const response = (await prefetchGuardMiddleware(
      { request, params: {}, context: {} } as never,
      next,
    )) as Response;

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    expect(response.headers.get('Vary')).toBe(
      'Sec-Purpose, Purpose, Sec-Fetch-Dest',
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('calls next for normal document requests and .data prefetches', async () => {
    const expected = new Response('ok', { status: 200 });
    const next = vi.fn(async () => expected);
    const request = new Request(
      'https://d2onetrick.com/profile/u1/c/c1/loadouts',
      {
        method: 'GET',
        headers: {
          'sec-fetch-dest': 'document',
          referer: 'https://d2onetrick.com/profile/u1/c/c1',
          host: 'd2onetrick.com',
        },
      },
    );

    const response = await prefetchGuardMiddleware(
      { request, params: {}, context: {} } as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(response).toBe(expected);
  });
});
