import { Activity } from 'lucide-react';
import { Link, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { type Profile, type Session, getSessions, getUser } from '~/api';
import { ActiveSessionCard } from '~/components/active-session-card';
import { buttonVariants } from '~/components/ui/button';
import { Logger } from '~/lib/logger';
import { cn } from '~/lib/utils';

import type { Route } from './+types/active-sessions';

export function meta({}: Route.MetaArgs) {
  const title = 'Active Sessions — One Trick';
  const description =
    'Browse active Destiny 2 tracking sessions. View live player stats, loadouts, and performance in progress.';
  const url = 'https://d2onetrick.com/active-sessions';

  return [
    { title },
    { description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  let userProfile: Profile | null = null;
  if (auth?.id) {
    try {
      const { data } = await getUser({ path: { userId: auth.id } });
      userProfile = data ?? null;
    } catch {
      userProfile = null;
    }
  }

  try {
    const pendingRes = await getSessions({
      query: { count: 20, page: 0, status: 'pending' },
    });
    const activeSessions: Session[] = pendingRes.data ?? [];

    const userActiveSession = activeSessions.find((s) => s.userId === auth?.id);
    const userCharacterId =
      userActiveSession?.characterId || userProfile?.characters?.[0]?.id;

    const userIds = Array.from(new Set(activeSessions.map((s) => s.userId)));

    const profilesList = await Promise.all(
      userIds.map(async (userId) => {
        const { data: profile, error } = await getUser({
          path: { userId },
        });
        if (error) {
          return null;
        }
        return profile;
      }),
    );

    const profiles = profilesList.reduce<Record<string, Profile>>(
      (state, current) => {
        if (current) {
          state[current.id] = current;
        }
        return state;
      },
      {},
    );

    return {
      activeSessions,
      profiles,
      auth,
      userActiveSession,
      userCharacterId,
    };
  } catch (e) {
    Logger.error(e, 'Failed to fetch active sessions');
    return {
      activeSessions: [] as Session[],
      profiles: {},
      auth,
      userActiveSession: undefined,
      userCharacterId: undefined,
    };
  }
}

function getActionTarget({
  auth,
  userActiveSession,
  userCharacterId,
}: {
  auth?: { id: string } | null;
  userActiveSession?: Session;
  userCharacterId?: string;
}): string {
  if (!auth) {
    return '/login';
  }
  if (userActiveSession) {
    return `/profile/${auth.id}/c/${userActiveSession.characterId}/sessions/${userActiveSession.id}`;
  }
  if (userCharacterId) {
    return `/profile/${auth.id}/c/${userCharacterId}/sessions`;
  }
  return `/profile/${auth.id}`;
}

function getActionLabel({
  auth,
  userActiveSession,
}: {
  auth?: { id: string } | null;
  userActiveSession?: Session;
}): string {
  if (!auth) {
    return 'Sign In to Track';
  }
  if (userActiveSession) {
    return 'View My Active Session';
  }
  return 'Go to My Sessions';
}

export function ActiveSessionsPage() {
  const { activeSessions, profiles, auth, userActiveSession, userCharacterId } =
    useLoaderData<typeof loader>();

  const actionUrl = getActionTarget({
    auth,
    userActiveSession,
    userCharacterId,
  });

  const actionLabel = getActionLabel({
    auth,
    userActiveSession,
  });

  return (
    <div className="flex w-full flex-1 flex-col justify-start gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            <Activity className="h-8 w-8 text-primary" />
            Active Sessions
          </h1>
          <p className="mt-1 text-muted-foreground">
            Explore live Destiny 2 sessions currently being tracked.
          </p>
        </div>

        <Link
          to={actionUrl}
          className={cn(
            buttonVariants({ variant: 'default' }),
            'shrink-0 text-sm font-semibold',
          )}
        >
          {actionLabel}
        </Link>
      </div>

      {activeSessions.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Activity className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold">No Active Sessions</h3>
          <p className="mt-2 max-w-md text-balance text-sm text-muted-foreground">
            {auth
              ? 'There are currently no active community sessions. Head over to your sessions page to start tracking!'
              : 'There are currently no active sessions being tracked. Sign in to start your own tracking session!'}
          </p>
          <Link
            to={actionUrl}
            className={cn(
              buttonVariants({ variant: 'default' }),
              'mt-6 font-medium',
            )}
          >
            {actionLabel}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {activeSessions.map((session) => (
            <ActiveSessionCard
              key={session.id}
              session={session}
              profile={profiles[session.userId]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ActiveSessionsPage;
