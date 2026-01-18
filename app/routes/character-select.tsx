import { Link } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating, useProfileData } from '~/hooks/use-route-loaders';

import type { Route } from './+types/character-select';

export default function CharacterSelect({ loaderData }: Route.ComponentProps) {
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
    <div className="flex h-screen items-center justify-center">
      <title>Choose a Character</title>
      <meta property="og:title" content="Choose a Character" />
      <meta
        name="description"
        content="Select the Destiny 2 character to view sessions, snapshots, and metrics."
      />
      <div className="flex w-full flex-col items-center gap-4 px-6 md:w-1/2 md:px-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {type === 'viewer'
            ? ' Which character do you want to view for'
            : 'Welcome,'}{' '}
          {profile.displayName}
        </h2>
        <CharacterPicker characters={characters}>
          {(current) => {
            return (
              <LoadingButton asChild isLoading={isNavigating}>
                <Link to={`c/${current}`}>Pick Guardian</Link>
              </LoadingButton>
            );
          }}
        </CharacterPicker>
      </div>
    </div>
  );
}
