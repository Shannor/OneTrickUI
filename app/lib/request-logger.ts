export interface RequestLogMeta {
  method: string;
  url: string;
  pathname: string;
  userAgent: string | null;
  referer: string | null;
  ip: string | null;
  forwardedProto: string | null;
  host: string | null;
  purpose: string | null;
  secFetchDest: string | null;
  secFetchMode: string | null;
  secFetchSite: string | null;
  hasCookie: boolean;
}

/**
 * Safely masks authorization codes or tokens for log output.
 * e.g. "d5439663e6f6f1ff025d49d92534ed88" -> "d54396..."
 */
export function maskCode(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code.length <= 6) return '***';
  return `${code.slice(0, 6)}...`;
}

/**
 * Sanitizes a URL string by masking sensitive query parameters like `code`.
 */
export function sanitizeUrl(urlStr: string | URL): string {
  try {
    const urlObj =
      typeof urlStr === 'string' ? new URL(urlStr) : new URL(urlStr.href);
    const codeParam = urlObj.searchParams.get('code');
    if (codeParam) {
      urlObj.searchParams.set('code', maskCode(codeParam) ?? '***');
    }
    return urlObj.toString();
  } catch {
    return typeof urlStr === 'string' ? urlStr : urlStr.href;
  }
}

/**
 * Extracts structured metadata from an incoming HTTP Request for logging.
 */
export function extractRequestMeta(request: Request): RequestLogMeta {
  const sanitizedUrl = sanitizeUrl(request.url);
  let pathname = '';
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    pathname = '';
  }

  const getHeader = (name: string) => request.headers.get(name);

  return {
    method: request.method,
    url: sanitizedUrl,
    pathname,
    userAgent: getHeader('user-agent'),
    referer: getHeader('referer') || getHeader('referrer'),
    ip: getHeader('x-forwarded-for') || getHeader('x-real-ip'),
    forwardedProto: getHeader('x-forwarded-proto'),
    host: getHeader('host') || getHeader('x-forwarded-host'),
    purpose:
      getHeader('purpose') ||
      getHeader('sec-purpose') ||
      getHeader('x-purpose'),
    secFetchDest: getHeader('sec-fetch-dest'),
    secFetchMode: getHeader('sec-fetch-mode'),
    secFetchSite: getHeader('sec-fetch-site'),
    hasCookie: Boolean(getHeader('cookie')),
  };
}
