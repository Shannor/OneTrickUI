const ALLOWED_ORIGINAL_HOSTS = new Set([
  'd2onetrick.com',
  'www.d2onetrick.com',
]);

export function resolveTrustedOriginalHost(headerValue) {
  if (!headerValue) {
    return null;
  }
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (typeof raw !== 'string') {
    return null;
  }
  const firstHost = raw.split(',')[0]?.trim().toLowerCase().split(':')[0];
  if (!firstHost || !ALLOWED_ORIGINAL_HOSTS.has(firstHost)) {
    return null;
  }
  return firstHost;
}

export function createOriginalHostMiddleware() {
  return function originalHostMiddleware(req, _res, next) {
    const trustedHost = resolveTrustedOriginalHost(
      req.headers?.['x-original-host'],
    );
    // Cloud Run's Google Frontend strips incoming X-Forwarded-Host on direct
    // .run.app requests; restore it from the Cloudflare Worker's X-Original-Host
    // so Express and React Router compute canonical d2onetrick.com URLs.
    if (trustedHost) {
      req.headers['x-forwarded-host'] = trustedHost;
    }
    next();
  };
}
