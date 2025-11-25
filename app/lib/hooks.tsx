// app/hooks/use-profile-layout.ts
import { useNavigation, useParams, useRouteLoaderData } from 'react-router';
import type { loader } from '~/routes/profile-state';

export function useIsNavigating(): [boolean] {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  return [isNavigating];
}

export function useProfileData() {
  const data = useRouteLoaderData<typeof loader>('routes/profile-state');
  const { characterId } = useParams();
  if (!data) {
    throw new Error(
      'useProfileData must be used within profile state parent route',
    );
  }
  const character = data.profile?.characters.find((c) => c.id === characterId);
  return { ...data, character };
}
