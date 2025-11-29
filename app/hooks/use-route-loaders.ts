import { useNavigation, useParams, useRouteLoaderData } from 'react-router';
import type { loader as profileStateLoader } from '~/routes/profile-state';
import type { loader as sessionLoader } from '~/routes/session';
import type { loader as snapshotLoader } from '~/routes/snapshot';

export function useIsNavigating(): [boolean] {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  return [isNavigating];
}

export function useProfileData() {
  const data = useRouteLoaderData<typeof profileStateLoader>(
    'routes/profile-state',
  );
  const { characterId } = useParams();
  if (!data) {
    throw new Error(
      'useProfileData must be used within profile state parent route',
    );
  }
  const character = data.profile?.characters.find((c) => c.id === characterId);
  return { ...data, character };
}

export function useSessionData() {
  const data = useRouteLoaderData<typeof sessionLoader>('routes/session');
  if (!data) {
    throw new Error(
      'useSessionData must be used within a session parent route',
    );
  }
  if (data.error) {
    throw new Error(data.error);
  }
  if (!data.session) {
    throw new Error('Session data not found');
  }
  return data;
}
export function useSnapshotData() {
  const data = useRouteLoaderData<typeof snapshotLoader>('routes/snapshot');
  if (!data) {
    throw new Error(
      'useSnapshotData must be used within snapshot parent route',
    );
  }
  return data;
}
