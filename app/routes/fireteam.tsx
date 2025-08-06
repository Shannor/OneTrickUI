import { Form, Link, data, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import {
  commitSession,
  getPreferenceSession,
  getPreferences,
} from '~/.server/preferences';
import {
  type Session,
  getFireteam,
  getPublicProfile,
  getPublicSessions,
  profile,
} from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/fireteam';

export async function loader({ params, request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const { data: fireteam, error } = await getFireteam({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    return { members: [], error: 'failed to get profile data', sessions: [] };
  }
  if (!fireteam) {
    return { members: [], error: 'no data returned' };
  }
  if (!fireteam?.length) {
    return { members: [], fireteamCharacters: [], sessions: [] };
  }
  const fireteamMemberIds = new Set(fireteam.map((f) => f.membershipId));
  const { fireteam: savedFireteam } = await getPreferences(request);

  const characterInformation = await Promise.all(
    fireteam.map(async (member) => {
      const { data, error } = await getPublicProfile({
        query: {
          id: member.membershipId,
        },
      });
      if (error) {
        return {
          id: member.membershipId,
          userId: member.id,
          characters: [],
        };
      }
      return {
        id: member.membershipId,
        userId: member.id,
        characters: data?.characters ?? [],
      };
    }),
  );
  const currentFireteam = Object.entries(savedFireteam ?? {}).reduce<
    Record<string, string>
  >((state, [key, value]) => {
    if (fireteamMemberIds.has(key)) {
      state[key] = value;
    }
    return state;
  }, {});

  // Clear fireteam if someone leaves
  const session = await getPreferenceSession(request);
  session.set('fireteam', currentFireteam);
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
  return data(
    {
      members: fireteam ?? [],
      fireteamCharacters: characterInformation ?? [],
      sessions: sessionData.filter(Boolean),
    },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
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
        const data = fireteamCharacters?.find((f) => f.id === m.membershipId);
        if (!data) {
          return <div>Empty</div>;
        }
        const { session, characterId } = sessionMap[data.id] ?? {};
        return (
          <div className="flex flex-col gap-4">
            <Form
              action="/dashboard/action/set-fireteam"
              method="post"
              key={data.id}
              viewTransition={true}
              className="flex flex-col gap-4"
            >
              <Link to={`/dashboard/profiles/${data.id}`} viewTransition>
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight hover:text-blue-400 hover:underline">
                  {m.displayName}
                </h4>
              </Link>
              <input hidden value={data.id} name="membershipId" />
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
