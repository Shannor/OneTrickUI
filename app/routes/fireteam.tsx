import { Form, Link, data } from 'react-router';
import { getFireteamData } from '~/.server/fireteam';
import { setPreferences } from '~/.server/preferences';
import { type Session, getPublicSessions } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/fireteam';

export async function loader({ params, request }: Route.LoaderArgs) {
  const response = await getFireteamData(request);
  if (response.status === 'error') {
    throw new Error(response.error);
  }

  const { fireteam, selectedCharacters, charactersPromise } = response;
  const characters = await charactersPromise;
  const fireteamMemberIds = new Set(fireteam.map((f) => f.membershipId));
  const currentFireteam = Object.entries(selectedCharacters ?? {}).reduce<
    Record<string, string>
  >((state, [key, value]) => {
    if (fireteamMemberIds.has(key)) {
      state[key] = value;
    }
    return state;
  }, {});

  // Clear fireteam if someone leaves
  const sessionData = await Promise.all(
    Object.entries(currentFireteam).map(async ([membershipId, characterId]) => {
      const { data, error } = await getPublicSessions({
        query: {
          count: 1,
          page: 0,
          status: 'pending',
          characterId,
        },
      });
      if (error) {
        return null;
      }
      return {
        characterId,
        membershipId,
        session: data?.at(0),
      };
    }),
  );
  const headers = await setPreferences(request, { fireteam: currentFireteam });
  return data(
    {
      members: fireteam ?? [],
      fireteamCharacters: characters,
      sessions: sessionData.filter(Boolean),
    },
    {
      ...headers,
    },
  );
}

interface SessionTemp {
  characterId: string;
  membershipId: string;
  session?: Session;
}
// Can end the session for someone else? I'm thinking nah
// Double dipping with multiple snapshots when in a fireteam by each memeber.

export default function Fireteam({
  matches,
  loaderData,
}: Route.ComponentProps) {
  const { members, fireteamCharacters, sessions } = loaderData;

  const [isSubmitting] = useIsNavigating();

  const sessionMap =
    sessions?.reduce<Record<string, SessionTemp>>((state, current) => {
      if (current) {
        state[current.membershipId] = current;
      }
      return state;
    }, {}) ?? {};

  if (members.length === 0) {
    return (
      <Empty
        title="You are currently offline."
        description="Refresh once you're signed in to Destiny and have choosen your character"
      />
    );
  }
  return (
    <div className="flex flex-row gap-4">
      {members.map((m) => {
        // For current signed in player we can preselect
        const data = fireteamCharacters?.find(
          (f) => f.membershipId === m.membershipId,
        );
        if (!data) {
          return <div>Empty</div>;
        }
        const { session, characterId } = sessionMap[data.membershipId] ?? {};
        return (
          <div className="flex flex-col gap-4">
            <Form
              action="/dashboard/action/set-fireteam"
              method="post"
              key={data.membershipId}
              viewTransition={true}
              className="flex flex-col gap-4"
            >
              <Link
                to={`/dashboard/profiles/${data.membershipId}`}
                viewTransition
              >
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight hover:text-blue-400 hover:underline">
                  {m.displayName}
                </h4>
              </Link>
              <input hidden value={data.membershipId} name="membershipId" />
              <CharacterPicker
                characters={data?.characters ?? []}
                currentCharacterId={characterId}
              >
                {(current, previous) => {
                  const isDisabled =
                    Boolean(current) &&
                    Boolean(previous) &&
                    current === previous;
                  return (
                    <LoadingButton
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={isDisabled}
                    >
                      {!characterId ? 'Pick a Guardian' : 'Change Guardian'}
                    </LoadingButton>
                  );
                }}
              </CharacterPicker>
            </Form>
            <Form
              className="flex flex-col gap-4"
              method="post"
              action="/dashboard/action/start-session"
              viewTransition
            >
              <input hidden name="characterId" value={characterId} />
              <input hidden name="userId" value={data.userId} />
              <div>Current Session</div>
              {session ? (
                <div>
                  <div>{session.name}</div>
                  <div>Games: {session.aggregateIds?.length ?? 0}</div>
                </div>
              ) : (
                <div>
                  <div>No current session.</div>
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Start a Session
                  </LoadingButton>
                </div>
              )}
            </Form>
          </div>
        );
      })}
    </div>
  );
}
