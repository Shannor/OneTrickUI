export const PREFETCH_VARY_HEADER = 'Sec-Purpose, Purpose, Sec-Fetch-Dest';

// 503 causes Chromium's Speculation Rules cache to discard the speculative
// document entry (kPrefetchFailedNon2XX) rather than buffering a 2xx response.
export const PREFETCH_SHORT_CIRCUIT_STATUS = 503;

export const PREFETCH_SHORT_CIRCUIT_HEADERS = Object.freeze({
  Vary: PREFETCH_VARY_HEADER,
  'Cache-Control': 'no-store',
});

const KNOWN_APP_HOSTS = new Set(['d2onetrick.com', 'www.d2onetrick.com']);

function readHeader(headers, name) {
  if (!headers) {
    return null;
  }
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  const value = headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return typeof value === 'string' ? value : null;
}

export function isPrefetchPurpose(headerValue) {
  if (!headerValue) {
    return false;
  }
  return headerValue
    .toLowerCase()
    .split(/[,;]/)
    .some((token) => token.trim() === 'prefetch');
}

function normalizeFirstHost(hostHeader) {
  if (!hostHeader) {
    return null;
  }
  const first = hostHeader.split(',')[0]?.trim().toLowerCase();
  return first || null;
}

export function isSameOriginAppReferer(refererHeader, requestHostHeader) {
  if (!refererHeader) {
    return false;
  }
  let refererUrl;
  try {
    refererUrl = new URL(refererHeader);
  } catch {
    return false;
  }

  if (refererUrl.protocol !== 'http:' && refererUrl.protocol !== 'https:') {
    return false;
  }

  const refererHostname = refererUrl.hostname.toLowerCase();
  if (KNOWN_APP_HOSTS.has(refererHostname)) {
    return true;
  }

  const requestHost = normalizeFirstHost(requestHostHeader);
  if (!requestHost) {
    return false;
  }

  return refererUrl.host.toLowerCase() === requestHost;
}

function extractRequestParts(input) {
  if (typeof Request !== 'undefined' && input instanceof Request) {
    let pathname = '/';
    let urlHost = null;
    try {
      const parsed = new URL(input.url);
      pathname = parsed.pathname;
      urlHost = parsed.host;
    } catch {
      pathname = '/';
    }
    return {
      method: input.method,
      pathname,
      headers: input.headers,
      fallbackHost: urlHost,
    };
  }

  const rawPath = input.pathname ?? input.path ?? input.url ?? '/';
  const pathname = rawPath.split('?')[0] || '/';
  return {
    method: input.method ?? 'GET',
    pathname,
    headers: input.headers,
    fallbackHost: null,
  };
}

export function shouldShortCircuitDocumentPrefetch(input) {
  const { method, pathname, headers, fallbackHost } =
    extractRequestParts(input);

  if (!method || method.toUpperCase() !== 'GET') {
    return false;
  }

  if (pathname.endsWith('.data')) {
    return false;
  }

  const secFetchDest = readHeader(headers, 'sec-fetch-dest');
  if (!secFetchDest || secFetchDest.toLowerCase().trim() !== 'document') {
    return false;
  }

  const secPurpose = readHeader(headers, 'sec-purpose');
  const legacyPurpose = readHeader(headers, 'purpose');
  if (!isPrefetchPurpose(secPurpose) && !isPrefetchPurpose(legacyPurpose)) {
    return false;
  }

  const referer =
    readHeader(headers, 'referer') || readHeader(headers, 'referrer');
  const requestHost =
    readHeader(headers, 'x-forwarded-host') ||
    readHeader(headers, 'host') ||
    fallbackHost;

  return isSameOriginAppReferer(referer, requestHost);
}

export function createPrefetchGuardMiddleware() {
  return function prefetchGuardMiddleware(req, res, next) {
    if (shouldShortCircuitDocumentPrefetch(req)) {
      res.setHeader('Vary', PREFETCH_VARY_HEADER);
      res.setHeader('Cache-Control', 'no-store');
      res.status(PREFETCH_SHORT_CIRCUIT_STATUS).end();
      return;
    }
    next();
  };
}
