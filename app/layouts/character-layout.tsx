import { Link, Outlet, useParams } from 'react-router';
import { CharacterItem } from '~/components/character-item';
import { useProfileData } from '~/hooks/use-route-loaders';

export function CharacterLayout() {
  const { characterId } = useParams();
  const response = useProfileData();

  if (response.type === 'error') {
    return <Outlet />;
  }

  const { profile } = response;
  const characters = profile.characters;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-3">
        {characters?.map((character) => (
          <Link
            key={character.id}
            to={`/profile/${profile.id}/c/${character.id}`}
            className="block w-full min-w-0"
          >
            <CharacterItem
              character={character}
              isChecked={characterId === character.id}
            />
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

export default CharacterLayout;
