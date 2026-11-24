import { getSimilarSnapshots } from '~/api';

const similarFetchCache = new WeakMap<
  Request,
  Map<string, ReturnType<typeof getSimilarSnapshots<false>>>
>();

export function requestTargetsSimilarRoute(request: Request): boolean {
  try {
    const { pathname } = new URL(request.url);
    return /\/similar(?:\.data)?\/?$/.test(pathname);
  } catch {
    return false;
  }
}

/**
 * Per-request deduplicated fetch for `getSimilarSnapshots`.
 * When the incoming request targets `/loadouts/:snapshotId/similar`, upgrades
 * `includeStats` to `true` so `routes/loadout` and `routes/loadout-similar`
 * share a single backend request instead of firing twice.
 */
export function getCachedSimilarSnapshots(
  request: Request | undefined,
  snapshotId: string,
  options?: { includeStats?: boolean },
) {
  const includeStats =
    Boolean(options?.includeStats) ||
    (request ? requestTargetsSimilarRoute(request) : false);

  const callApi = () =>
    getSimilarSnapshots({
      path: { snapshotId },
      query: { includeStats },
    });

  if (!request) {
    return callApi();
  }

  let map = similarFetchCache.get(request);
  if (!map) {
    map = new Map();
    similarFetchCache.set(request, map);
  }

  const cacheKey = `${snapshotId}:${includeStats ? 'stats' : 'nostats'}`;
  const existing = map.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = callApi();
  map.set(cacheKey, promise);
  return promise;
}
