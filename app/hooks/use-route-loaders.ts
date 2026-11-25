import { createError } from 'evlog';
import {
  type Location,
  useLocation,
  useNavigation,
  useParams,
  useRouteLoaderData,
} from 'react-router';
import type { RootLoaderData } from '~/root';
import type { loader as snapshotLoader } from '~/routes/loadout';
import type { loader as profileStateLoader } from '~/routes/profile-state';
import type { loader as sessionLoader } from '~/routes/session';

export type NavigationScope = 'idle' | 'same-route' | 'sub-tab' | 'cross-route';

export interface NavigationState {
  scope: NavigationScope;
  isNavigating: boolean;
  isCrossRoute: boolean;
  isSameRoute: boolean;
  isSubTab: boolean;
  isScopedPending: boolean;
  nextLocation: Location | undefined;
}

const DETAIL_TAB_LAYOUT_PATTERN =
  /^(\/profile\/[^/]+\/c\/[^/]+\/(?:sessions|loadouts)\/[^/]+)(?:\/[^/]+)?$/;

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

export function classifyNavigationScope(
  currentPathname: string,
  nextPathname: string | undefined,
): NavigationScope {
  if (!nextPathname) {
    return 'idle';
  }

  const current = normalizePathname(currentPathname);
  const next = normalizePathname(nextPathname);

  if (current === next) {
    return 'same-route';
  }

  const currentDetailBase = current.match(DETAIL_TAB_LAYOUT_PATTERN)?.[1];
  const nextDetailBase = next.match(DETAIL_TAB_LAYOUT_PATTERN)?.[1];
  if (currentDetailBase && currentDetailBase === nextDetailBase) {
    return 'sub-tab';
  }

  return 'cross-route';
}

export function useNavigationState(): NavigationState {
  const navigation = useNavigation();
  const location = useLocation();
  const nextLocation = navigation.location;
  const scope = classifyNavigationScope(
    location.pathname,
    nextLocation?.pathname,
  );
  const isNavigating = scope !== 'idle';
  const isCrossRoute = scope === 'cross-route';
  const isSameRoute = scope === 'same-route';
  const isSubTab = scope === 'sub-tab';

  return {
    scope,
    isNavigating,
    isCrossRoute,
    isSameRoute,
    isSubTab,
    isScopedPending: isSameRoute || isSubTab,
    nextLocation,
  };
}

export function useIsNavigating(options?: {
  scope?: 'all' | 'cross-route';
}): [boolean] {
  const navigationState = useNavigationState();
  if (options?.scope === 'cross-route') {
    return [navigationState.isCrossRoute];
  }
  return [navigationState.isNavigating];
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
