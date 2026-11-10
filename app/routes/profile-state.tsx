import { Outlet, data } from 'react-router';
import { getAuth, refreshHeaders } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { getUser } from '~/api';

import type { Route } from './+types/character-select';

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const auth = await getAuth(request);
  log.set({
    route: 'routes/profile-state',
    profile: { userId: params.id, viewerId: auth?.id },
  });
  const { data: profile, error } = await getUser({
    path: {
      userId: params.id,
    },
  });
  if (error) {
    log.error('Failed to fetch user profile in profile-state loader', {
      profile: { userId: params.id, error },
    });
    return {
      type: 'error',
      error: error.message,
    } as const;
  }

  if (auth && params.id === auth.id) {
    const headers = await refreshHeaders(request, auth);
    return data({ profile, isSignedIn: true, type: 'owner', auth } as const, {
      ...headers,
    });
  } else if (auth && params.id !== auth.id) {
    const headers = await refreshHeaders(request, auth);
    return data({ profile, isSignedIn: true, type: 'viewer', auth } as const, {
      ...headers,
    });
  } else {
    return {
      profile,
      isSignedIn: false,
      type: 'viewer',
      auth: undefined,
    } as const;
  }
}

export default function ProfileState() {
  return <Outlet />;
}
