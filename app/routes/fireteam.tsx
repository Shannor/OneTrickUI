import { Users } from 'lucide-react';
import { data } from 'react-router';
import { getFireteamData } from '~/.server/fireteam';
import { setPreferences } from '~/.server/preferences';
import { getUserSessions } from '~/api';
import { Empty } from '~/components/empty';
import { FireteamHeader } from '~/components/fireteam-header';
import { FireteamMemberCard } from '~/components/fireteam-member-card';
import { useIsNavigating } from '~/hooks/use-route-loaders';

import type { Route } from './+types/fireteam';

type FireteamSession = {
  characterId: string;
  userId: string;
  session?: {
    id: string;
    name?: string;
    status?: 'pending' | 'complete';
    aggregateIds?: string[];
    userId: string;
    characterId: string;
  };
};

export async function loader({ request }: Route.LoaderArgs) {
  const response = await getFireteamData(request);
  if (response.status === 'error') {
    return data({
      members: [],
      sessions: [] as FireteamSession[],
      fireteamMemWithCharacters: {} as Record<string, string>,
    });
  }

  const { fireteam, selectedCharacters } = response;
  const members = Array.isArray(fireteam) ? fireteam : [];
  const withCharacters = members.reduce<Record<string, string>>((state, m) => {
    const memberKey = m.id || m.membershipId;
    const prefChar =
      (m.id ? selectedCharacters?.[m.id] : undefined) ??
      (m.membershipId ? selectedCharacters?.[m.membershipId] : undefined);
    const defaultChar = m.characters?.[0]?.id;
    const charId = prefChar ?? defaultChar;
    if (charId && memberKey) {
      if (m.id) {
        state[m.id] = charId;
      }
      if (m.membershipId) {
        state[m.membershipId] = charId;
      }
    }
    return state;
  }, {});

  const sessions: FireteamSession[] = await Promise.all(
    Object.entries(withCharacters).map(async ([userId, characterId]) => {
      try {
        const { data: userSessionsData, error } = await getUserSessions({
          path: {
            userId,
          },
          query: {
            count: BigInt(1),
            page: BigInt(0),
            characterId,
          },
        });
        if (error || !userSessionsData) {
          return {
            characterId,
            userId,
            session: undefined,
          };
        }
        const s = userSessionsData.at(0);
        const plainSession = s
          ? {
              id: s.id,
              name: s.name,
              status: s.status,
              aggregateIds: s.aggregateIds ? [...s.aggregateIds] : [],
              userId: s.userId,
              characterId: s.characterId,
            }
          : undefined;
        return {
          characterId,
          userId,
          session: plainSession,
        };
      } catch {
        return {
          characterId,
          userId,
          session: undefined,
        };
      }
    }),
  );
  const headers = await setPreferences(request, {
    fireteam: withCharacters,
  });
  return data(
    {
      members,
      sessions,
      fireteamMemWithCharacters: withCharacters,
    },
    {
      ...headers,
    },
  );
}

export default function Fireteam({ loaderData }: Route.ComponentProps) {
  const { members, sessions, fireteamMemWithCharacters } = loaderData;
  const [isSubmitting] = useIsNavigating();

  if (members.length === 0) {
    return (
      <Empty
        title="You are currently offline."
        description="Refresh once you're signed in to Destiny 2 and have chosen your character."
        icon={<Users className="h-16 w-16 self-center text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <title>Fireteam | 1 Trick</title>
      <meta property="og:title" content="Fireteam | 1 Trick" />
      <meta
        name="description"
        content="View your current fireteam and manage active character selections."
      />

      <FireteamHeader memberCount={members.length} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {members.map((m) => {
          const memberSession = sessions.find(
            (it) =>
              (m.id && it?.userId === m.id) ||
              (m.membershipId && it?.userId === m.membershipId),
          )?.session;
          const charId =
            (m.id ? fireteamMemWithCharacters[m.id] : undefined) ??
            (m.membershipId
              ? fireteamMemWithCharacters[m.membershipId]
              : undefined);
          return (
            <FireteamMemberCard
              key={m.membershipId || m.id}
              member={m}
              characterId={charId}
              session={memberSession}
              isSubmitting={isSubmitting}
            />
          );
        })}
      </div>
    </div>
  );
}
