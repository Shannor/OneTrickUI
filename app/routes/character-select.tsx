import { Link } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating, useProfileData } from '~/hooks/use-route-loaders';

export function CharacterSelect() {
  const data = useProfileData();
  const [isNavigating] = useIsNavigating();

  if (!data) {
    return <div>Loading...</div>;
  }
  if (data.type === 'error') {
    return (
      <Empty
        title="Failed to load characters"
        description="Didn't find any characters for this account."
      />
    );
  }

  const { profile, type } = data;
  const characters = profile.characters;
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <title>Choose a Character</title>
      <meta property="og:title" content="Choose a Character" />
      <meta
        name="description"
        content="Select the Destiny 2 character to view sessions, snapshots, and metrics."
      />
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h2 className="w-full scroll-m-20 break-words border-b pb-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {type === 'viewer'
            ? `Which character do you want to view for ${profile.displayName}?`
            : `Welcome, ${profile.displayName}`}
        </h2>
        <CharacterPicker characters={characters}>
          {(current) => {
            const isDisabled = !current;
            return (
              <LoadingButton
                asChild={!isDisabled}
                disabled={isDisabled}
                isLoading={isNavigating}
              >
                {isDisabled ? (
                  'Pick Guardian'
                ) : (
                  <Link to={`c/${current}`}>Pick Guardian</Link>
                )}
              </LoadingButton>
            );
          }}
        </CharacterPicker>
      </div>
    </div>
  );
}

export default CharacterSelect;
