import { createError } from 'evlog';
import { useNavigation, useParams, useRouteLoaderData } from 'react-router';
import type { RootLoaderData } from '~/root';
import type { loader as snapshotLoader } from '~/routes/loadout';
import type { loader as profileStateLoader } from '~/routes/profile-state';
import type { loader as sessionLoader } from '~/routes/session';

export function useIsNavigating(): [boolean] {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  return [isNavigating];
}

export function useRootData(): RootLoaderData | undefined {
  return useRouteLoaderData<RootLoaderData>('root');
}

export function useOptionalProfileData() {
  const data = useRouteLoaderData<typeof profileStateLoader>(
    'routes/profile-state',
  );
  const { characterId } = useParams();
  if (!data || data.type === 'error') {
    return null;
  }
  const character = data.profile?.characters?.find((c) => c.id === characterId);
  return { ...data, character };
}

export function useProfileData() {
  const data = useRouteLoaderData<typeof profileStateLoader>(
    'routes/profile-state',
  );
  const { characterId } = useParams();
  if (!data) {
    throw createError({
      message: 'useProfileData must be used within profile state parent route',
      status: 500,
      why: 'Profile route loader data is missing in current route hierarchy',
      fix: 'Render this component inside the routes/profile-state parent route',
    });
  }
  const character = data.profile?.characters?.find((c) => c.id === characterId);
  return { ...data, character };
}

export function useSessionData() {
  const data = useRouteLoaderData<typeof sessionLoader>('routes/session');
  if (!data) {
    throw createError({
      message: 'useSessionData must be used within a session parent route',
      status: 500,
      why: 'Session route loader data is missing in current route hierarchy',
      fix: 'Render this component inside the routes/session parent route',
    });
  }
  if (data.error) {
    throw createError({
      message: data.error,
      status: 404,
      why: 'The session loader returned an error',
      fix: 'Verify the session ID and try again',
    });
  }
  if (!data.session) {
    throw createError({
      message: 'Session data not found',
      status: 404,
      why: 'No session record was returned by the session loader',
      fix: 'Verify the session ID and try again',
    });
  }
  return data;
}
export function useLoadoutData() {
  const data = useRouteLoaderData<typeof snapshotLoader>('routes/loadout');
  if (!data) {
    throw createError({
      message: 'useLoadoutData must be used within loadout parent route',
      status: 500,
      why: 'Loadout route loader data is missing in current route hierarchy',
      fix: 'Render this component inside the routes/loadout parent route',
    });
  }
  return data;
}
