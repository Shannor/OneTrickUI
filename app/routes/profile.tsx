import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { type Profile, getPublicProfile, getPublicSessions } from '~/api';
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

  if (!id) {
    return { error: 'missing id' };
  }
  let account: Profile;
  try {
    const { data } = await getPublicProfile({ query: { id } });
    if (data) {
      account = data;
    } else {
      return { error: 'no account found' };
    }
  } catch (e) {
    console.error(e);
    return { error: 'unexpected error' };
  }

  if (!characterId) {
    return { account, sessions: [] };
  }

  try {
    const sessions = await getPublicSessions({
      query: {
        count: 10,
        page: 0,
        characterId,
      },
    });
    return { account, sessions: sessions.data ?? [] };
  } catch (e) {
    console.error(e);
    return { error: 'unexpected error' };
  }
}

export default function Profile() {
  const { account, error, sessions } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const [isNavigating] = useIsNavigating();

  const [params] = useSearchParams();
  const characterId = params.get('characterId');

  const navigate = useNavigate();

  if (error) {
    return <Empty title="Error" />;
  }

  return (
    <div className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <Link
              to={{
                pathname: 'sessions',
                search: `?characterId=${characterId}`,
              }}
            >
              Sessions
            </Link>
            <Link
              to={{
                pathname: 'loadouts',
                search: `?characterId=${characterId}`,
              }}
            >
              Loadouts
            </Link>
            <Link
              to={{
                pathname: 'activities',
                search: `?characterId=${characterId}`,
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
