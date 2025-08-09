import { type ReactNode, Suspense, use } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Form, Link, data } from 'react-router';
import { getFireteamData } from '~/.server/fireteam';
import { setPreferences } from '~/.server/preferences';
import { type FireteamMember, type Session, getPublicSessions } from '~/api';
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

  const { fireteam, selectedCharacters, charactersPromise } = response;
  const fireteamMemberIds = new Set(fireteam.map((f) => f.membershipId));
  const fireteamMemWithCharacters = Object.entries(
    selectedCharacters ?? {},
  ).reduce<Record<string, string>>((state, [key, value]) => {
    if (fireteamMemberIds.has(key)) {
      state[key] = value;
    }
    return state;
  }, {});

  // Clear fireteam if someone leaves
  const sessionPromise = Promise.all(
    Object.entries(fireteamMemWithCharacters).map(
      async ([membershipId, characterId]) => {
        const { data, error } = await getPublicSessions({
          query: {
            count: 1,
            page: 0,
            status: 'pending',
            characterId,
          },
        });
        if (error) {
          return {
            characterId,
            membershipId,
            session: undefined,
          };
        }
        return {
          characterId,
          membershipId,
          session: data?.at(0),
        };
      },
    ),
  );
  const headers = await setPreferences(request, {
    fireteam: fireteamMemWithCharacters,
  });
  return data(
    {
      members: fireteam ?? [],
      charactersPromise,
      sessionPromise,
      fireteamMemWithCharacters,
    },
    {
      ...headers,
    },
  );
}

// Can end the session for someone else? I'm thinking nah
// Double dipping with multiple snapshots when in a fireteam by each memeber.

export default function Fireteam({ loaderData }: Route.ComponentProps) {
  const {
    members,
    charactersPromise,
    sessionPromise,
    fireteamMemWithCharacters,
  } = loaderData;

  if (members.length === 0) {
    return (
      <Empty
        title="You are currently offline."
        description="Refresh once you're signed in to Destiny and have choosen your character"
      />
    );
  }

  return (
    <div className="flex flex-row flex-wrap gap-4">
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
                charactersPromise={charactersPromise}
                sessionPromise={sessionPromise}
                member={m}
                characterId={fireteamMemWithCharacters[m.membershipId]}
              />
            </ClientFallback>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  charactersPromise: Route.ComponentProps['loaderData']['charactersPromise'];
  sessionPromise: Route.ComponentProps['loaderData']['sessionPromise'];
  member: FireteamMember;
  characterId?: string;
  children?: ReactNode;
}
function CharacterView({
  charactersPromise,
  sessionPromise,
  member,
  characterId,
}: Props) {
  const [isSubmitting] = useIsNavigating();
  // For current signed in player we can preselect
  const allFireteamCharacters = use(charactersPromise);
  const myCharacters = allFireteamCharacters.find(
    (it) => it.membershipId === member.membershipId,
  )?.characters;
  if (!myCharacters) {
  }

  const sessions = use(sessionPromise);
  const session = sessions.find(
    (it) => it?.membershipId === member.membershipId,
  )?.session;
  return (
    <div className="flex flex-col gap-4">
      <Form
        action="/dashboard/action/set-fireteam"
        method="post"
        key={member.membershipId}
        viewTransition={true}
        className="flex flex-col gap-4"
      >
        <Link to={`/dashboard/profiles/${member.membershipId}`} viewTransition>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight hover:text-blue-400 hover:underline">
            {member.displayName}
          </h4>
        </Link>
        <input hidden value={member.membershipId} name="membershipId" />
        <CharacterPicker
          characters={myCharacters ?? []}
          currentCharacterId={characterId}
        >
          {(current, previous) => {
            const isDisabled =
              Boolean(current) && Boolean(previous) && current === previous;
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
        <input hidden name="userId" value={member.id} />
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
}
