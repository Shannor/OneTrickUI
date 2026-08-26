import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Link, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { type Profile, type Session, getSessions, getUser } from '~/api';
import { ActiveSessionCard } from '~/components/active-session-card';
import { Button, buttonVariants } from '~/components/ui/button';
import { Logger } from '~/lib/logger';
import { cn } from '~/lib/utils';

import type { Route } from './+types/community-sessions';

export function meta({}: Route.MetaArgs) {
  const title = 'Sessions — One Trick';
  const description =
    'Browse Destiny 2 PvP tracking sessions. View live player stats, loadouts, and game logs.';
  const url = 'https://d2onetrick.com/sessions';

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

const PAGE_SIZE = 12;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Math.max(0, Number(url.searchParams.get('page') || '0'));
  const statusParam = url.searchParams.get('status') || 'all';

  const statusFilter =
    statusParam === 'pending' || statusParam === 'complete'
      ? statusParam
      : undefined;

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
    const sessionsRes = await getSessions({
      query: {
        count: PAGE_SIZE,
        page,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
    });
    const sessions: Session[] = sessionsRes.data ?? [];

    const userActiveSession = sessions.find(
      (s) => s.userId === auth?.id && s.status === 'pending',
    );
    const userCharacterId =
      userActiveSession?.characterId || userProfile?.characters?.[0]?.id;

    const userIds = Array.from(new Set(sessions.map((s) => s.userId)));

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
      sessions,
      profiles,
      auth,
      page,
      status: statusParam,
      userActiveSession,
      userCharacterId,
    };
  } catch (e) {
    Logger.error(e, 'Failed to fetch community sessions');
    return {
      sessions: [] as Session[],
      profiles: {},
      auth,
      page,
      status: statusParam,
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

export function CommunitySessionsPage() {
  const {
    sessions,
    profiles,
    auth,
    page,
    status,
    userActiveSession,
    userCharacterId,
  } = useLoaderData<typeof loader>();

  const actionUrl = getActionTarget({
    auth,
    userActiveSession,
    userCharacterId,
  });

  const actionLabel = getActionLabel({
    auth,
    userActiveSession,
  });

  const hasNextPage = sessions.length === PAGE_SIZE;

  const buildFilterUrl = (newStatus: string) => {
    const params = new URLSearchParams();
    if (newStatus !== 'all') {
      params.set('status', newStatus);
    }
    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (newPage > 0) {
      params.set('page', newPage.toString());
    }
    if (status !== 'all') {
      params.set('status', status);
    }
    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-start gap-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            <Users className="h-8 w-8 text-primary" />
            Sessions
          </h1>
          <p className="mt-1 text-muted-foreground">
            Browse PvP tracking sessions logged by Guardians across the
            community.
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

      {/* Filter Tabs / Status Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <Link
            to={buildFilterUrl('all')}
            className={cn(
              buttonVariants({
                variant: status === 'all' ? 'default' : 'outline',
                size: 'sm',
              }),
            )}
          >
            All Sessions
          </Link>
          <Link
            to={buildFilterUrl('pending')}
            className={cn(
              buttonVariants({
                variant: status === 'pending' ? 'default' : 'outline',
                size: 'sm',
              }),
            )}
          >
            Active Only
          </Link>
          <Link
            to={buildFilterUrl('complete')}
            className={cn(
              buttonVariants({
                variant: status === 'complete' ? 'default' : 'outline',
                size: 'sm',
              }),
            )}
          >
            Completed Only
          </Link>
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          Page {page + 1}
        </span>
      </div>

      {/* Sessions Grid / Empty State */}
      {sessions.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold">No Sessions Found</h3>
          <p className="mt-2 max-w-md text-balance text-sm text-muted-foreground">
            {page > 0
              ? 'No sessions found on this page. Try navigating back to earlier pages.'
              : auth
                ? 'No community sessions found matching your filter. Head over to your sessions page to start tracking!'
                : 'No community sessions found matching your filter. Sign in to start your own tracking session!'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {page > 0 && (
              <Button asChild variant="outline">
                <Link to={buildPageUrl(0)}>Back to First Page</Link>
              </Button>
            )}
            <Link
              to={actionUrl}
              className={cn(
                buttonVariants({ variant: 'default' }),
                'font-medium',
              )}
            >
              {actionLabel}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sessions.map((session) => (
            <ActiveSessionCard
              key={session.id}
              session={session}
              profile={profiles[session.userId]}
            />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {(page > 0 || hasNextPage) && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button asChild disabled={page === 0} variant="outline" size="sm">
            {page === 0 ? (
              <span>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous Page
              </span>
            ) : (
              <Link to={buildPageUrl(page - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous Page
              </Link>
            )}
          </Button>

          <span className="text-xs font-semibold text-muted-foreground">
            Page {page + 1}
          </span>

          <Button asChild disabled={!hasNextPage} variant="outline" size="sm">
            {!hasNextPage ? (
              <span>
                Next Page <ChevronRight className="ml-1 h-4 w-4" />
              </span>
            ) : (
              <Link to={buildPageUrl(page + 1)}>
                Next Page <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CommunitySessionsPage;
