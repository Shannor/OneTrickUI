import { Outlet, useLocation, useParams } from 'react-router';
import { CharacterSwitcher } from '~/components/character-switcher';
import { useProfileData } from '~/hooks/use-route-loaders';

const PRESERVED_SUB_ROUTES = new Set([
  'loadouts',
  'sessions',
  'metrics',
  'fireteam',
]);

export function buildCharacterSwitchHref(
  profileId: string,
  currentCharacterId: string | undefined,
  nextCharacterId: string,
  pathname: string,
  search: string,
): string {
  const basePrefix = `/profile/${profileId}/c/${currentCharacterId}`;
  let suffix = '';

  if (currentCharacterId && pathname.startsWith(basePrefix)) {
    const rest = pathname.slice(basePrefix.length).replace(/^\//, '');
    const topSegment = rest.split('/')[0];
    if (
      topSegment &&
      PRESERVED_SUB_ROUTES.has(topSegment) &&
      !rest.includes('/')
    ) {
      suffix = `/${topSegment}`;
    }
  }

  return `/profile/${profileId}/c/${nextCharacterId}${suffix}${search}`;
}

export function CharacterLayout() {
  const { characterId } = useParams();
  const location = useLocation();
  const response = useProfileData();

  if (response.type === 'error') {
    return <Outlet />;
  }

  const { profile } = response;
  const characters = profile.characters ?? [];

  const buildCharacterHref = (nextCharacterId: string) =>
    buildCharacterSwitchHref(
      profile.id,
      characterId,
      nextCharacterId,
      location.pathname,
      location.search,
    );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <CharacterSwitcher
        characters={characters}
        activeCharacterId={characterId}
        buildCharacterHref={buildCharacterHref}
      />

      <Outlet />
    </div>
  );
}

export default CharacterLayout;
