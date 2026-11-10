import { Outlet, type ShouldRevalidateFunctionArgs, data } from 'react-router';
import { getAuth, getCachedUser, refreshHeaders } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';

import type { Route } from './+types/character-select';

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const [auth, { data: profile, error }] = await Promise.all([
    getAuth(request),
    getCachedUser(request, params.id),
  ]);
  log.set({
    layout: 'routes/profile-state',
    profile: { userId: params.id, viewerId: auth?.id },
  });
  if (error || !profile) {
    log.error('Failed to fetch user profile in profile-state loader', {
      profile: { userId: params.id, error },
    });
    return {
      type: 'error',
      error: error?.message ?? 'Profile not found',
    } as const;
  }

  if (auth && params.id === auth.id) {
    const headers = await refreshHeaders(request, auth);
    return data({ profile, isSignedIn: true, type: 'owner', auth } as const, {
      ...headers,
    });
  }
  if (auth && params.id !== auth.id) {
    const headers = await refreshHeaders(request, auth);
    return data({ profile, isSignedIn: true, type: 'viewer', auth } as const, {
      ...headers,
    });
  }
  return {
    profile,
    isSignedIn: false,
    type: 'viewer',
    auth: undefined,
  } as const;
}

// Built-in React Router route module export that controls when this layout's loader re-runs on navigation
export function shouldRevalidate({
  currentParams,
  nextParams,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod && formMethod !== 'GET') {
    return defaultShouldRevalidate;
  }
  return currentParams.id !== nextParams.id;
}

export default function ProfileState() {
  return <Outlet />;
}
