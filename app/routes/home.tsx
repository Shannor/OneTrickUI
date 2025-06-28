import { Form, useOutletContext } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating } from '~/lib/hooks';
import type { OutletContext } from '~/types/context';

import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'One Trick - Home' },
    { name: 'description', content: 'Welcome to One Trick!' },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <div>Oops, something went wrong!</div>;
}

export default function Home() {
  const { profile, characterId } = useOutletContext<OutletContext>();
  const [isNavigating] = useIsNavigating();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Welcome, {profile?.displayName}!
      </h2>
      <div className="grid place-items-center">
        <Form action="/dashboard/action/set-preference" method="post">
          <CharacterPicker
            characters={profile.characters}
            currentCharacterId={characterId}
          >
            {(current, previous) => {
              const isDisabled =
                Boolean(current) && Boolean(previous) && current === previous;
              return (
                <LoadingButton
                  type="submit"
                  disabled={isDisabled}
                  isLoading={isNavigating}
                >
                  {!characterId ? 'Pick a Guardian' : 'Change Guardian'}
                </LoadingButton>
              );
            }}
          </CharacterPicker>
        </Form>
      </div>
    </div>
  );
}
