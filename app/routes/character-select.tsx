import { Form, data, redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { getPreferences } from '~/.server/preferences';
import { profile } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/character-select';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    return redirect('/login');
  }
  const { character } = await getPreferences(request);
  const { data: profileData, error } = await profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    if (error.status === 'DestinyServerDown') {
      throw data(error.message, { status: 503 });
    }
    Logger.error(error.message, { error });
    throw data(error.message, { status: 500 });
  }
  if (!profileData) {
    throw data('No profile data', { status: 500 });
  }
  return data({
    profile: profileData,
    character,
    membershipId: auth.primaryMembershipId,
  });
}

export default function CharacterSelect({ loaderData }: Route.ComponentProps) {
  const { profile, character, membershipId } = loaderData;
  const [isNavigating] = useIsNavigating();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Welcome, {profile?.displayName}!
      </h2>
      <div className="grid place-items-center">
        <Form action="/dashboard/action/set-preference" method="post">
          <input readOnly hidden name="redirectTo" value="/dashboard" />
          <CharacterPicker
            characters={profile.characters}
            currentCharacterId={character?.id}
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
                  {!character?.id ? 'Pick a Guardian' : 'Change Guardian'}
                </LoadingButton>
              );
            }}
          </CharacterPicker>
        </Form>
      </div>
    </div>
  );
}
