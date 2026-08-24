import LogRocket from 'logrocket';
import { isRouteErrorResponse } from 'react-router';

export interface UserTrackData {
  id: string;
  name?: string;
  displayName?: string;
  uniqueName?: string;
  membershipId?: string;
  primaryMembershipId?: string;
}

export function trackUserSession(user: UserTrackData | null | undefined): void {
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
  LogRocket.identify(user.id, traits);
}

export function trackError(error: unknown): void {
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
    LogRocket.captureException(new Error(JSON.stringify(error)), {
      extra: {
        pathname,
        is404,
      },
    });
  }
}
