import { Link, Outlet, useParams } from 'react-router';
import { CharacterItem } from '~/components/character-item';
import { useProfileData } from '~/hooks/use-route-loaders';
import { cn } from '~/lib/utils';

export function CharacterLayout() {
  const { characterId } = useParams();
  const response = useProfileData();

  if (response.type === 'error') {
    return <Outlet />;
  }

  const { profile } = response;
  const characters = profile.characters ?? [];
  const hasSingleUnchecked = characters.length === 2;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div
        className={cn(
          'grid w-full grid-cols-2 gap-2.5 sm:gap-3',
          characters.length === 2 ? 'xl:grid-cols-2' : 'xl:grid-cols-3',
        )}
      >
        {characters.map((character) => {
          const isChecked = characterId === character.id;
          return (
            <Link
              key={character.id}
              to={`/profile/${profile.id}/c/${character.id}`}
              className={cn(
                'block w-full min-w-0',
                isChecked
                  ? 'order-first col-span-2 xl:order-none xl:col-span-1'
                  : hasSingleUnchecked
                    ? 'col-span-2 xl:col-span-1'
                    : 'col-span-1',
              )}
            >
              <CharacterItem
                character={character}
                isChecked={isChecked}
                compactWhenUnchecked
              />
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}

export default CharacterLayout;


