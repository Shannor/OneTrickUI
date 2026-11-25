import type { Route } from '../+types/root';
import {
  PREFETCH_SHORT_CIRCUIT_HEADERS,
  PREFETCH_SHORT_CIRCUIT_STATUS,
  shouldShortCircuitDocumentPrefetch,
} from '../../server/prefetch-guard.mjs';

export const prefetchGuardMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  if (shouldShortCircuitDocumentPrefetch(request)) {
    return new Response(null, {
      status: PREFETCH_SHORT_CIRCUIT_STATUS,
      headers: PREFETCH_SHORT_CIRCUIT_HEADERS,
    });
  }
  return next();
};
