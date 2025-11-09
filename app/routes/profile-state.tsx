import { Outlet, data } from 'react-router';
import { getAuth, refreshHeaders } from '~/.server/auth';
import { getUser } from '~/api';

import type { Route } from './+types/character-select';

export async function loader({ params, request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  const { data: profile, error } = await getUser({
    path: {
      userId: params.id,
    },
  });
  if (error) {
    console.error(error);
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
