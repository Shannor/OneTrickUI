import { Form, Link, Outlet, useLoaderData, useLocation } from 'react-router';
import { getUser } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { NavLoading } from '~/components/nav-loading';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const characterId = url.searchParams.get('characterId');
  const id = params.id;

  try {
    const { data } = await getUser({ path: { userId: id } });
    if (data) {
      return { account: data, characterId };
    } else {
      return { error: 'no account found' };
    }
  } catch (e) {
    console.error(e);
    return { error: 'unexpected error' };
  }
}

export default function Profile() {
  const { account, error, characterId } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const [isNavigating] = useIsNavigating();

  if (error) {
    return <Empty title="Error" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <title>{`${account?.displayName ?? 'Profile'}`}</title>
      <meta property="og:title" content={`${account?.displayName ?? 'Profile'}`} />
      <meta name="description" content={`View ${account?.displayName ?? 'the user'}'s Destiny 2 profile, sessions, loadouts, and activities.`} />
      <h1 className="scroll-m-20 text-balance text-center text-4xl font-extrabold tracking-tight">
        {account?.displayName}
      </h1>
      <div className="flex flex-row gap-4">
        <Form action={pathname} className="flex flex-col gap-4">
          <CharacterPicker
            currentCharacterId={characterId}
            characters={account?.characters ?? []}
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
        <div className="gap- flex w-full flex-col">
          <div className="flex flex-row gap-4">
            <Link
              to={{
                pathname: 'sessions',
                search: `?characterId=${characterId}&userId=${account?.id}`,
              }}
            >
              Sessions
            </Link>
            <Link
              to={{
                pathname: 'loadouts',
                search: `?characterId=${characterId}&userId=${account?.id}`,
              }}
            >
              Loadouts
            </Link>
            <Link
              to={{
                pathname: 'activities',
                search: `?characterId=${characterId}&userId=${account?.id}`,
              }}
            >
              Activities
            </Link>
          </div>
          <NavLoading>
            <Outlet />
          </NavLoading>
        </div>
      </div>
    </div>
  );
}
