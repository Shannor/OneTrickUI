import type { Route } from '../+types/root';
import type { Client } from '~/api/client/types.gen';
import { client } from '~/api/client.gen';

const METADATA_IDENTITY_ENDPOINT =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity';
const EXPIRY_SAFETY_BUFFER_MS = 5 * 60 * 1000;
const FALLBACK_TTL_MS = 55 * 60 * 1000;
const METADATA_TIMEOUT_MS = 2_000;

interface CachedIdentityToken {
  token: string;
  expiresAtMs: number;
}

export interface CloudRunIdentityProviderOptions {
  fetchImpl?: typeof fetch;
  nowFn?: () => number;
  isCloudRunRuntime?: () => boolean;
}

function isCloudRunOrigin(hostname: string): boolean {
  return hostname.toLowerCase().endsWith('.run.app');
}

function parseJwtExpiryMs(jwt: string, nowMs: number): number {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return nowMs + FALLBACK_TTL_MS;
  }
  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (typeof payload.exp === 'number' && payload.exp > 0) {
      return payload.exp * 1000 - EXPIRY_SAFETY_BUFFER_MS;
    }
  } catch {
    // Fall back to conservative 55-minute TTL if token payload cannot be parsed.
  }
  return nowMs + FALLBACK_TTL_MS;
}

export function createCloudRunIdentityProvider(
  options: CloudRunIdentityProviderOptions = {},
) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const nowFn = options.nowFn ?? Date.now;
  const isCloudRunRuntime =
    options.isCloudRunRuntime ?? (() => Boolean(process.env.K_SERVICE));

  const tokenCache = new Map<string, CachedIdentityToken>();
  const inFlight = new Map<string, Promise<string | null>>();

  async function fetchMetadataToken(audience: string): Promise<string | null> {
    const url = `${METADATA_IDENTITY_ENDPOINT}?audience=${encodeURIComponent(audience)}`;
    try {
      const response = await fetchImpl(url, {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: AbortSignal.timeout(METADATA_TIMEOUT_MS),
      });
      if (!response.ok) {
        return null;
      }
      const token = (await response.text()).trim();
      if (!token) {
        return null;
      }
      tokenCache.set(audience, {
        token,
        expiresAtMs: parseJwtExpiryMs(token, nowFn()),
      });
      return token;
    } catch {
      return null;
    }
  }

  return {
    async getIdentityToken(audience: string): Promise<string | null> {
      if (!isCloudRunRuntime()) {
        return null;
      }

      const cached = tokenCache.get(audience);
      if (cached && cached.expiresAtMs > nowFn()) {
        return cached.token;
      }

      const pending = inFlight.get(audience);
      if (pending) {
        return pending;
      }

      const requestPromise = fetchMetadataToken(audience).finally(() => {
        inFlight.delete(audience);
      });
      inFlight.set(audience, requestPromise);
      return requestPromise;
    },
  };
}

export function createCloudRunRequestInterceptor(
  provider = createCloudRunIdentityProvider(),
) {
  return async function attachCloudRunAuthHeader(
    request: Request,
  ): Promise<Request> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(request.url);
    } catch {
      return request;
    }

    if (!isCloudRunOrigin(parsedUrl.hostname)) {
      return request;
    }

    const idToken = await provider.getIdentityToken(parsedUrl.origin);
    if (!idToken) {
      return request;
    }

    const headers = new Headers(request.headers);
    // Cloud Run verifies and strips X-Serverless-Authorization at the proxy,
    // keeping Authorization intact for user Bungie OAuth tokens.
    headers.set('X-Serverless-Authorization', `Bearer ${idToken}`);
    return new Request(request, { headers });
  };
}

const registeredClients = new WeakSet<Client>();

export function registerCloudRunApiInterceptor(
  targetClient: Client = client,
  interceptor = createCloudRunRequestInterceptor(),
): void {
  if (registeredClients.has(targetClient)) {
    return;
  }
  targetClient.interceptors.request.use(interceptor);
  registeredClients.add(targetClient);
}

export const cloudRunAuthMiddleware: Route.MiddlewareFunction = async (
  _args,
  next,
) => {
  registerCloudRunApiInterceptor(client);
  return next();
};
