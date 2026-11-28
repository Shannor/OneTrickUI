import { describe, expect, it, vi } from 'vitest';

import { createClient, createConfig } from '~/api/client';
import {
  createCloudRunIdentityProvider,
  createCloudRunRequestInterceptor,
  registerCloudRunApiInterceptor,
} from './cloud-run-auth';

function makeJwtWithExp(expSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString(
    'base64url',
  );
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds })).toString(
    'base64url',
  );
  return `${header}.${payload}.sig`;
}

describe('createCloudRunIdentityProvider', () => {
  it('skips metadata server calls outside Cloud Run runtime', async () => {
    const fetchMock = vi.fn();
    const provider = createCloudRunIdentityProvider({
      fetchImpl: fetchMock as unknown as typeof fetch,
      isCloudRunRuntime: () => false,
    });

    const token = await provider.getIdentityToken(
      'https://onetrick-63827765203.us-central1.run.app',
    );
    expect(token).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('caches metadata identity tokens per audience and deduplicates concurrent requests', async () => {
    let nowMs = 1_700_000_000_000;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const audience = url.searchParams.get('audience') ?? '';
      const exp = Math.floor(nowMs / 1000) + 3600;
      return new Response(`${makeJwtWithExp(exp)}-${audience}`, { status: 200 });
    });

    const provider = createCloudRunIdentityProvider({
      fetchImpl: fetchMock as unknown as typeof fetch,
      nowFn: () => nowMs,
      isCloudRunRuntime: () => true,
    });

    const origin = 'https://onetrick-63827765203.us-central1.run.app';
    const [first, second] = await Promise.all([
      provider.getIdentityToken(origin),
      provider.getIdentityToken(origin),
    ]);

    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    nowMs += 56 * 60 * 1000;
    await provider.getIdentityToken(origin);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('registerCloudRunApiInterceptor', () => {
  it('attaches X-Serverless-Authorization only on .run.app origins while preserving Bungie Authorization', async () => {
    const outboundFetch = vi.fn(async (req: Request) => {
      return Response.json({
        authorization: req.headers.get('authorization'),
        serverlessAuth: req.headers.get('x-serverless-authorization'),
      });
    });

    const testClient = createClient(
      createConfig({
        baseUrl: 'https://onetrick-63827765203.us-central1.run.app',
        fetch: outboundFetch as unknown as typeof fetch,
      }),
    );

    const interceptor = createCloudRunRequestInterceptor(
      createCloudRunIdentityProvider({
        fetchImpl: vi.fn(async () => new Response('oidc-jwt-token')) as unknown as typeof fetch,
        isCloudRunRuntime: () => true,
      }),
    );

    registerCloudRunApiInterceptor(testClient, interceptor);
    registerCloudRunApiInterceptor(testClient, interceptor);

    await testClient.get({
      url: '/users/42',
      headers: { Authorization: 'Bearer bungie-user-token' },
    });

    expect(outboundFetch).toHaveBeenCalledTimes(1);
    const sentReq = outboundFetch.mock.calls[0][0] as Request;
    expect(sentReq.headers.get('authorization')).toBe('Bearer bungie-user-token');
    expect(sentReq.headers.get('x-serverless-authorization')).toBe(
      'Bearer oidc-jwt-token',
    );

    testClient.setConfig({ baseUrl: 'http://localhost:8080' });
    await testClient.get({ url: '/users/42' });
    const localReq = outboundFetch.mock.calls[1][0] as Request;
    expect(localReq.headers.get('x-serverless-authorization')).toBeNull();
  });
});
