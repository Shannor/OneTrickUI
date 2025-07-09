import {
  Form,
  Link,
  data,
  useLoaderData,
  useViewTransitionState,
} from 'react-router';
import { getAuth } from '~/.server/auth';
import {
  commitSession,
  getPreferenceSession,
  getPreferences,
} from '~/.server/preferences';
import {
  type Session,
  getPublicProfile,
  getPublicSessions,
  profile,
} from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';

import type { Route } from '../../.react-router/types/app/routes/+types/fireteam';

export async function loader({ params, request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const { data: profileData, error } = await profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    return { members: [], error: 'failed to get profile data', sessions: [] };
  }
  if (!profileData) {
    return { members: [], error: 'no data returned' };
  }
  if (!profileData.fireteam?.length) {
    return { members: [], fireteamCharacters: [], sessions: [] };
  }
  const fireteamMemberIds = new Set(
    profileData.fireteam.map((f) => f.membershipId),
  );
  const { fireteam: savedFireteam } = await getPreferences(request);

  const characterInformation = await Promise.all(
    profileData.fireteam.map(async (member) => {
      const { data, error } = await getPublicProfile({
        query: {
          id: member.membershipId,
        },
      });
      if (error) {
        return {
          id: member.membershipId,
          characters: [],
        };
      }
      return {
        id: member.membershipId,
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
      members: profileData.fireteam ?? [],
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
export default function Fireteam() {
  const { members, fireteamCharacters, sessions } =
    useLoaderData<typeof loader>();

  const isSubmitting = useViewTransitionState('/dashboard/action/set-fireteam');
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
        const sessionData = sessionMap[data.id];
        return (
          <Form
            action="/dashboard/action/set-fireteam"
            method="post"
            key={data.id}
            viewTransition={true}
          >
            <Link to={`/dashboard/profiles/${sessionData.membershipId}`}>
              {m.displayName}
            </Link>
            <input hidden value={data.id} name="membershipId" />
            <CharacterPicker
              characters={data?.characters ?? []}
              currentCharacterId={sessionData?.characterId}
            />
            <LoadingButton type="submit" isLoading={isSubmitting}>
              Choose Character
            </LoadingButton>
          </Form>
        );
      })}
    </div>
  );
}
