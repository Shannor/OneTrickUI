import { useNavigation, useParams, useRouteLoaderData } from 'react-router';
import type { loader as profileStateLoader } from '~/routes/profile-state';
import type { loader as sessionLoader } from '~/routes/session';

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
  return data;
}
