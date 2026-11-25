import { createError, log } from 'evlog';
import { isRouteErrorResponse } from 'react-router';

export interface UserTrackData {
  id: string;
  name?: string;
  displayName?: string;
  uniqueName?: string;
  membershipId?: string;
  primaryMembershipId?: string;
}

type LogRocketClient = typeof import('logrocket');

let cachedLogRocketPromise: Promise<LogRocketClient | null> | null = null;

function loadLogRocket(): Promise<LogRocketClient | null> {
  if (!cachedLogRocketPromise) {
    cachedLogRocketPromise = import('logrocket')
      .then((mod) => {
        const interop = mod as unknown as { default?: LogRocketClient };
        const client = interop.default ?? mod;
        client.init('gruntt/d2-one-trick');
        return client;
      })
      .catch((error) => {
        cachedLogRocketPromise = null;
        log.warn({
          action: 'tracking.init_failed',
          message: 'Failed to load or initialize LogRocket',
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      });
  }
  return cachedLogRocketPromise;
}

export async function initTracking(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  await loadLogRocket();
}

export async function trackUserSession(
  user: UserTrackData | null | undefined,
): Promise<void> {
  if (typeof window === 'undefined' || !user?.id) {
    return;
  }
  const traits: Record<string, string | number | boolean> = {};
  if (user.name) {
    traits.name = user.name;
  }
  if (user.displayName) {
    traits.displayName = user.displayName;
  }
  if (user.uniqueName) {
    traits.uniqueName = user.uniqueName;
  }
  if (user.membershipId) {
    traits.membershipId = user.membershipId;
  }
  if (user.primaryMembershipId) {
    traits.primaryMembershipId = user.primaryMembershipId;
  }
  const LogRocket = await loadLogRocket();
  LogRocket?.identify(user.id, traits);
}

export async function trackError(error: unknown): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  let is404 = false;
  if (isRouteErrorResponse(error)) {
    is404 = error.status === 404;
  } else if (typeof error === 'object' && error !== null && 'status' in error) {
    is404 = (error as { status: number }).status === 404;
  }

  const pathname = window.location.pathname;
  const href = window.location.href;
  const LogRocket = await loadLogRocket();
  if (!LogRocket) {
    return;
  }

  if (is404) {
    LogRocket.track('404_page_not_found', {
      pathname,
      href,
      referrer: document.referrer,
    });
  }

  if (error instanceof Error) {
    LogRocket.captureException(error, {
      extra: {
        pathname,
        is404,
      },
    });
  } else if (typeof error === 'object' && error !== null) {
    LogRocket.captureException(
      createError({
        message: JSON.stringify(error),
        status: is404 ? 404 : 500,
        why: 'Captured non-Error object in ErrorBoundary',
        fix: 'Inspect the serialized error payload in LogRocket',
      }),
      {
        extra: {
          pathname,
          is404,
        },
      },
    );
  }
}
