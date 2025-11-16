import { type ReactNode, use } from 'react';
import { Form, Link, data, useLocation } from 'react-router';
import { getFireteamData } from '~/.server/fireteam';
import { setPreferences } from '~/.server/preferences';
import { type FireteamMember, getUserSessions } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { ClientFallback } from '~/components/client-fallback';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { Skeleton } from '~/components/ui/skeleton';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/fireteam';

export async function loader({ params, request }: Route.LoaderArgs) {
  const response = await getFireteamData(request);
  if (response.status === 'error') {
    throw new Error(response.error);
  }

  const { fireteam, selectedCharacters } = response;
  const fireteamUserIds = new Set(fireteam.map((f) => f.id));
  const withCharacters = Object.entries(selectedCharacters ?? {}).reduce<
    Record<string, string>
  >((state, [key, value]) => {
    if (fireteamUserIds.has(key)) {
      state[key] = value;
    }
    return state;
  }, {});

  // TODO: Remove public sessions call to use the user one
  // Clear fireteam if someone leaves
  const sessionPromise = Promise.all(
    Object.entries(withCharacters).map(async ([userId, characterId]) => {
      const { data, error } = await getUserSessions({
        path: {
          userId,
        },
        query: {
          count: 1,
          page: 0,
          characterId,
        },
      });
      if (error) {
        return {
          characterId,
          userId,
          session: undefined,
        };
      }
      return {
        characterId,
        userId,
        session: data?.at(0),
      };
    }),
  );
  const headers = await setPreferences(request, {
    fireteam: withCharacters,
  });
  return data(
    {
      members: fireteam ?? [],
      sessionPromise,
      fireteamMemWithCharacters: withCharacters,
    },
    {
      ...headers,
    },
  );
}

// Can end the session for someone else? I'm thinking nah
// Double dipping with multiple snapshots when in a fireteam by each memeber.

export default function Fireteam({ loaderData }: Route.ComponentProps) {
  const { members, sessionPromise, fireteamMemWithCharacters } = loaderData;

  if (members.length === 0) {
    return (
      <Empty
        title="You are currently offline."
        description="Refresh once you're signed in to Destiny and have choosen your character"
      />
    );
  }

  return (
    <div className="flex w-full flex-row flex-wrap gap-4">
      <title>Fireteam</title>
      <meta property="og:title" content="Fireteam" />
      <meta
        name="description"
        content="View your current fireteam and manage character selections."
      />
      {members.map((m) => {
        return (
          <div key={m.membershipId}>
            <ClientFallback
              errorFallback={<Empty title="Failed to load" />}
              suspenseFallback={
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((it) => {
                    return <Skeleton key={it} className="h-20 w-80" />;
                  })}
                </div>
              }
            >
              <CharacterView
                sessionPromise={sessionPromise}
                member={m}
                characterId={fireteamMemWithCharacters[m.id]}
              />
            </ClientFallback>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  sessionPromise: Route.ComponentProps['loaderData']['sessionPromise'];
  member: FireteamMember;
  characterId?: string;
  children?: ReactNode;
}
function CharacterView({ sessionPromise, member, characterId }: Props) {
  const [isSubmitting] = useIsNavigating();
  const location = useLocation();

  const sessions = use(sessionPromise);
  const session = sessions.find((it) => it?.userId === member.id)?.session;
  const path = characterId
    ? `/profile/${member.id}/c/${characterId}`
    : `/profile/${member.id}`;
  return (
    <div className="flex flex-col gap-4">
      <Form
        action="/action/set-fireteam"
        method="post"
        key={member.membershipId}
        viewTransition={true}
        className="flex flex-col gap-4"
      >
        <Link to={path} viewTransition>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight hover:text-blue-400 hover:underline">
            {member.displayName}
          </h4>
        </Link>
        <input hidden value={member.id} name="userId" />
        <input hidden value={location.pathname} name="redirect" />
        <CharacterPicker
          characters={member.characters ?? []}
          currentCharacterId={characterId}
        >
          {(current, previous) => {
            const isDisabled =
              (Boolean(current) && Boolean(previous) && current === previous) ||
              !current;
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
        action="/action/start-session"
        viewTransition
      >
        <input hidden name="characterId" value={characterId} />
        <input hidden name="userId" value={member.id} />
        {session?.status === 'pending' ? (
          <div>
            <div>Current Session</div>
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
}
