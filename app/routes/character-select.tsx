import { Suspense } from 'react';
import { Await, Form, data, redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { profile } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import { Skeleton } from '~/components/ui/skeleton';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/character-select';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    return redirect('/login');
  }
  const { character } = await getPreferences(request);
  const profileData = profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  return data({
    profile: profileData,
    character,
  });
}

export default function CharacterSelect({ loaderData }: Route.ComponentProps) {
  const { profile, character } = loaderData;
  const [isNavigating] = useIsNavigating();
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="">
        <Suspense
          fallback={
            <div className="w-full">
              <div className="flex flex-row gap-4">
                <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                  Welcome,
                </h2>
                <Skeleton className="h-10 w-64" />
              </div>
              <div className="grid place-items-center gap-4">
                {[1, 2, 3].map((value) => {
                  return <Skeleton key={value} className="h-20 w-full" />;
                })}
                <Skeleton key="button" className="h-10 w-full" />
              </div>
            </div>
          }
        >
          <Await resolve={profile}>
            {({ data, error }) => {
              if (error) {
                return <div>Failed to load your characters!</div>;
              }
              return (
                <>
                  <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                    Welcome, {data.displayName}!
                  </h2>
                  <div className="grid place-items-center">
                    <Form
                      action="/dashboard/action/set-preference"
                      method="post"
                    >
                      <input
                        readOnly
                        hidden
                        name="redirectTo"
                        value="/dashboard"
                      />
                      <input readOnly hidden name="profileId" value={data.id} />
                      <input
                        readOnly
                        hidden
                        name="displayName"
                        value={data.displayName}
                      />
                      <input
                        readOnly
                        hidden
                        name="uniqueName"
                        value={data.uniqueName}
                      />
                      <input
                        readOnly
                        hidden
                        name="memebershipId"
                        value={data.membershipId}
                      />
                      <CharacterPicker
                        characters={data.characters}
                        currentCharacterId={character?.id}
                      >
                        {(current, previous) => {
                          return (
                            <LoadingButton
                              type="submit"
                              isLoading={isNavigating}
                            >
                              {!character?.id
                                ? 'Pick a Guardian'
                                : 'Change Guardian'}
                            </LoadingButton>
                          );
                        }}
                      </CharacterPicker>
                    </Form>
                  </div>
                </>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
