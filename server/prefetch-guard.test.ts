import { describe, expect, it, vi } from 'vitest';

import {
  PREFETCH_VARY_HEADER,
  type PrefetchGuardRequestInput,
  type PrefetchGuardResponse,
  createPrefetchGuardMiddleware,
  isPrefetchPurpose,
  isSameOriginAppReferer,
  shouldShortCircuitDocumentPrefetch,
} from './prefetch-guard.mjs';

function createMockExpressRes() {
  const headers: Record<string, string> = {};
  let statusCode: number | undefined;
  let ended = false;

  const res = {
    setHeader: vi.fn((key: string, value: string) => {
      headers[key.toLowerCase()] = value;
      return res;
    }),
    status: vi.fn((code: number) => {
      statusCode = code;
      return res;
    }),
    end: vi.fn(() => {
      ended = true;
      return res;
    }),
  };

  return {
    res: res as unknown as PrefetchGuardResponse,
    getHeaders: () => headers,
    getStatus: () => statusCode,
    isEnded: () => ended,
  };
}

describe('isPrefetchPurpose', () => {
  it('matches standard and parameterized prefetch tokens', () => {
    expect(isPrefetchPurpose('prefetch')).toBe(true);
    expect(isPrefetchPurpose('PREFETCH')).toBe(true);
    expect(isPrefetchPurpose('prefetch;prerender')).toBe(true);
    expect(isPrefetchPurpose('prefetch;anonymous-client-ip')).toBe(true);
    expect(isPrefetchPurpose('prefetch, prerender')).toBe(true);
  });

  it('ignores non-prefetch values', () => {
    expect(isPrefetchPurpose(null)).toBe(false);
    expect(isPrefetchPurpose('')).toBe(false);
    expect(isPrefetchPurpose('prerender')).toBe(false);
    expect(isPrefetchPurpose('navigate')).toBe(false);
  });
});

describe('isSameOriginAppReferer', () => {
  it('accepts d2onetrick.com and www.d2onetrick.com referers even behind proxy hosts', () => {
    expect(
      isSameOriginAppReferer(
        'https://d2onetrick.com/profile/u1/c/c1',
        'd2onetrick.com',
      ),
    ).toBe(true);
    expect(
      isSameOriginAppReferer(
        'https://www.d2onetrick.com/sessions',
        'd2onetrick.com',
      ),
    ).toBe(true);
    expect(
      isSameOriginAppReferer(
        'https://d2onetrick.com/profile/u1/c/c1',
        'onetrickui-abc.a.run.app',
      ),
    ).toBe(true);
  });

  it('accepts exact host matches for localhost and staging origins', () => {
    expect(
      isSameOriginAppReferer(
        'http://localhost:5173/profile/u1/c/c1',
        'localhost:5173',
      ),
    ).toBe(true);
    expect(
      isSameOriginAppReferer(
        'https://preview.run.app/sessions',
        'preview.run.app, internal-proxy',
      ),
    ).toBe(true);
  });

  it('rejects missing, invalid, mismatched port, and external referers', () => {
    expect(isSameOriginAppReferer(null, 'd2onetrick.com')).toBe(false);
    expect(isSameOriginAppReferer('not-a-url', 'd2onetrick.com')).toBe(false);
    expect(
      isSameOriginAppReferer('https://google.com/search?q=1trick', 'd2onetrick.com'),
    ).toBe(false);
    expect(
      isSameOriginAppReferer('https://evil-d2onetrick.com/', 'd2onetrick.com'),
    ).toBe(false);
    expect(
      isSameOriginAppReferer('http://localhost:9999/', 'localhost:5173'),
    ).toBe(false);
  });
});

describe('shouldShortCircuitDocumentPrefetch', () => {
  it('returns true for same-origin Sec-Purpose: prefetch document requests', () => {
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

    expect(shouldShortCircuitDocumentPrefetch(request)).toBe(true);
  });

  it('returns true for legacy Purpose: prefetch document requests from www.d2onetrick.com', () => {
    expect(
      shouldShortCircuitDocumentPrefetch({
        method: 'GET',
        path: '/profile/u1/c/c1/metrics',
        headers: {
          purpose: 'prefetch',
          'sec-fetch-dest': 'document',
          referer: 'https://www.d2onetrick.com/profile/u1/c/c1',
          host: 'd2onetrick.com',
        },
      }),
    ).toBe(true);
  });

  it('never short-circuits React Router .data requests or non-document prefetches', () => {
    expect(
      shouldShortCircuitDocumentPrefetch({
        method: 'GET',
        path: '/profile/u1/c/c1/loadouts.data',
        headers: {
          'sec-purpose': 'prefetch',
          'sec-fetch-dest': 'document',
          referer: 'https://d2onetrick.com/profile/u1/c/c1',
          host: 'd2onetrick.com',
        },
      }),
    ).toBe(false);

    expect(
      shouldShortCircuitDocumentPrefetch({
        method: 'GET',
        path: '/profile/u1/c/c1/loadouts.data',
        headers: {
          'sec-purpose': 'prefetch',
          'sec-fetch-dest': 'empty',
          referer: 'https://d2onetrick.com/profile/u1/c/c1',
          host: 'd2onetrick.com',
        },
      }),
    ).toBe(false);
  });

  it('never short-circuits external prefetches, direct navigations, or non-GET methods', () => {
    expect(
      shouldShortCircuitDocumentPrefetch({
        method: 'GET',
        path: '/profile/u1/c/c1/loadouts',
        headers: {
          'sec-purpose': 'prefetch',
          'sec-fetch-dest': 'document',
          referer: 'https://www.google.com/',
          host: 'd2onetrick.com',
        },
      }),
    ).toBe(false);

    expect(
      shouldShortCircuitDocumentPrefetch({
        method: 'GET',
        path: '/profile/u1/c/c1/loadouts',
        headers: {
          'sec-purpose': 'prefetch',
          'sec-fetch-dest': 'document',
          host: 'd2onetrick.com',
        },
      }),
    ).toBe(false);

    expect(
      shouldShortCircuitDocumentPrefetch({
        method: 'GET',
        path: '/profile/u1/c/c1/loadouts',
        headers: {
          'sec-fetch-dest': 'document',
          referer: 'https://d2onetrick.com/profile/u1/c/c1',
          host: 'd2onetrick.com',
        },
      }),
    ).toBe(false);

    expect(
      shouldShortCircuitDocumentPrefetch({
        method: 'POST',
        path: '/profile/u1/c/c1/loadouts',
        headers: {
          'sec-purpose': 'prefetch',
          'sec-fetch-dest': 'document',
          referer: 'https://d2onetrick.com/profile/u1/c/c1',
          host: 'd2onetrick.com',
        },
      }),
    ).toBe(false);
  });
});

describe('createPrefetchGuardMiddleware', () => {
  it('returns 503 Service Unavailable with Vary and Cache-Control headers and skips next() for in-app document prefetches', () => {
    const middleware = createPrefetchGuardMiddleware();
    const next = vi.fn();
    const { res, getHeaders, getStatus, isEnded } = createMockExpressRes();
    const req: PrefetchGuardRequestInput = {
      method: 'GET',
      path: '/profile/u1/c/c1/loadouts',
      headers: {
        'sec-purpose': 'prefetch',
        'sec-fetch-dest': 'document',
        referer: 'https://d2onetrick.com/profile/u1/c/c1',
        host: 'd2onetrick.com',
      },
    };

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(getStatus()).toBe(503);
    expect(isEnded()).toBe(true);
    expect(getHeaders()['vary']).toBe(PREFETCH_VARY_HEADER);
    expect(getHeaders()['cache-control']).toBe('no-store');
  });

  it('calls next() for normal document navigations and .data requests', () => {
    const middleware = createPrefetchGuardMiddleware();
    const next = vi.fn();
    const { res, getStatus } = createMockExpressRes();
    const req: PrefetchGuardRequestInput = {
      method: 'GET',
      path: '/profile/u1/c/c1/loadouts',
      headers: {
        'sec-fetch-dest': 'document',
        referer: 'https://d2onetrick.com/profile/u1/c/c1',
        host: 'd2onetrick.com',
      },
    };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(getStatus()).toBeUndefined();
  });
});
