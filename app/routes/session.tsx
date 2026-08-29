import { doc, onSnapshot } from '@firebase/firestore';
import { Info } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useRevalidator } from 'react-router';
import { getSession, getSessionAggregates } from '~/api';
import { Empty } from '~/components/empty';
import { SessionDate } from '~/components/session-date';
import { SessionHeaderActions } from '~/components/session-header-actions';
import { SessionOverview } from '~/components/session-overview';
import { SessionUpdateForm } from '~/components/session-update-form';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useProfileData } from '~/hooks/use-route-loaders';
import { db } from '~/lib/firebaseConfig';
import { Logger } from '~/lib/logger';

import type { Route } from './+types/session';

export async function loader({ params }: Route.LoaderArgs) {
  const { sessionId, id, characterId } = params;
  const res = await getSession({
    path: {
      sessionId,
    },
  });

  if (!res.data) {
    return { session: undefined, error: 'Session Not Found' };
  }
  const aggRes = await getSessionAggregates({
    path: {
      sessionId,
    },
  });

  const sharablePath = `profile/${id}/c/${characterId}/sessions/${sessionId}`;
  let path: string;
  if (process.env.NODE_ENV === 'development') {
    path = `https://local.d2onetrick.ngrok.app/${sharablePath}`;
  } else {
    path = `https://d2onetrick.com/${sharablePath}`;
  }
  if (!aggRes.data) {
    return {
      session: res.data,
      aggregates: [],
      snapshots: {},
      error: undefined,
      path,
    };
  }
  return {
    session: res.data,
    aggregates: aggRes.data.aggregates,
    snapshots: aggRes.data.snapshots,
    error: undefined,
    path,
  };
}

type ISession = Awaited<ReturnType<typeof getSession>>;

export function Session({ loaderData, params }: Route.ComponentProps) {
  const { profile, type } = useProfileData();
  const { session, aggregates, snapshots, error, path } = loaderData;
  const { characterId } = params;
  const isOwner = type === 'owner';
  const revalidator = useRevalidator();

  const location = useLocation();

  const currentTab = useMemo(() => {
    const tabPatterns = {
      metrics: /\/metrics\/?$/,
      loadouts: /\/loadouts\/?$/,
      games: /.*/,
    };

    return (
      Object.entries(tabPatterns).find(([_, pattern]) =>
        pattern.test(location.pathname),
      )?.[0] ?? 'games'
    );
  }, [location.pathname]);

  useEffect(() => {
    // Listen for real-time updates from Firestore
    if (!session) return;
    if (session.status == 'pending') {
      const unsubscribe = onSnapshot(
        doc(db, 'sessions', session.id),
        (snapshot) => {
          const newData = snapshot.data() as ISession['data'];
          if (!newData) return;
          const currentCount = session.aggregateIds?.length ?? 0;
          const newCount = newData.aggregateIds?.length ?? 0;
          if (newData.status == 'complete' || newCount !== currentCount) {
            revalidator
              .revalidate()
              .then(() => Logger.info('firestore updated'));
          }
        },
      );
      return () => {
        unsubscribe();
      };
    }
    // Clean up the listener when the component unmounts
  }, [session, revalidator]);

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <Empty
          title="No Session Found"
          description="Error loading this session. Please try again later."
        />
      </div>
    );
  }

  if (error) {
    Logger.error({ error }, 'Session loader error');
    return (
      <div>
        <Empty
          title="Error loading Session"
          description="Error loading this session. Please try again later."
        />
      </div>
    );
  }

  const isCurrent = session.status === 'pending';
  const gamesRecorded = session.aggregateIds?.length ?? 0;
  const showActiveNotice = isCurrent && gamesRecorded < 3;

  const pageTitle = `${session.name ?? 'Session'}${profile?.displayName ? ` - ${profile.displayName}` : ''} | 1 Trick`;
  const pageDescription =
    session.description ||
    `View games, metrics, and details for ${profile?.displayName ?? 'player'}'s session ${session.name ?? ''} on 1 Trick.`;

  return (
    <div className="flex flex-col gap-4">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={path} />
      <link rel="canonical" href={path} />
      <div className="flex w-full flex-col gap-4">
        {showActiveNotice && (
          <Alert className="border-blue-500/40 bg-blue-500/10 text-blue-950 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-100">
            <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <AlertTitle className="font-semibold">
              Session Active & Recording
            </AlertTitle>
            <AlertDescription className="text-xs text-blue-900/80 dark:text-blue-200/80">
              Start playing Destiny 2 matches to automatically record your
              gameplay and stats. Tracking will automatically end after 2 hours
              of inactivity.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {isCurrent && <Badge className="animate-pulse">Active</Badge>}
            <SessionDate
              startedAt={session.startedAt}
              completedAt={session.completedAt}
              className="text-sm"
            />
          </div>

          <SessionHeaderActions
            isOwner={isOwner}
            isCurrent={isCurrent}
            sessionId={session.id}
            sessionName={session.name}
            characterId={characterId}
            userId={profile?.id}
            shareUrl={path}
          />
        </div>

        {isOwner ? (
          <SessionUpdateForm
            sessionId={session.id}
            defaultName={session.name}
            defaultDescription={session.description}
          />
        ) : (
          <div className="flex w-full flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {session.name ?? ''}
            </h2>
            {session.description && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {session.description}
              </p>
            )}
          </div>
        )}

        <SessionOverview
          session={session}
          aggregates={aggregates}
          snapshots={snapshots}
          characterId={characterId}
        />

        <Tabs value={currentTab}>
          <TabsList>
            <TabsTrigger value="games" asChild>
              <NavLink to="." end>
                Games
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="metrics" asChild>
              <NavLink to="metrics">Metrics</NavLink>
            </TabsTrigger>
            <TabsTrigger value="loadouts" asChild>
              <NavLink to="loadouts">Loadouts</NavLink>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="w-full overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default Session;
