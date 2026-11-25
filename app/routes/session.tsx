import { log } from 'evlog';
import { doc, onSnapshot } from 'firebase/firestore';
import { Info } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { NavLink, Outlet, useLocation, useRevalidator } from 'react-router';
import { getRequestLogger } from '~/.server/logger';
import { getSession, getSessionAggregates } from '~/api';
import { Empty } from '~/components/empty';
import { SessionDate } from '~/components/session-date';
import { SessionHeaderActions } from '~/components/session-header-actions';
import { SessionOverview } from '~/components/session-overview';
import { SessionUpdateForm } from '~/components/session-update-form';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useNavigationState, useProfileData } from '~/hooks/use-route-loaders';
import { db } from '~/lib/firebaseConfig';
import { cn } from '~/lib/utils';

import type { Route } from './+types/session';

export const SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS = 300;

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { sessionId, id, characterId } = params;
  log.set({
    route: 'routes/session',
    session: { id: sessionId, userId: id, characterId },
  });
  const [res, aggRes] = await Promise.all([
    getSession({
      path: {
        sessionId,
      },
    }),
    getSessionAggregates({
      path: {
        sessionId,
      },
    }),
  ]);

  if (!res.data) {
    return { session: undefined, error: 'Session Not Found' };
  }

  const sharablePath = `profile/${id}/c/${characterId}/sessions/${sessionId}`;
  const devOrigin = request
    ? new URL(request.url).origin
    : 'http://localhost:5173';
  const path =
    process.env.NODE_ENV === 'development'
      ? `${devOrigin}/${sharablePath}`
      : `https://d2onetrick.com/${sharablePath}`;
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

type FirestoreSessionData = NonNullable<ISession['data']> & {
  lastSeenActivityId?: string | null;
};

export function Session({ loaderData, params }: Route.ComponentProps) {
  const { profile, type } = useProfileData();
  const { isSubTab: isSwitchingTab } = useNavigationState();
  const { session, aggregates, error, path } = loaderData;
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
      Object.entries(tabPatterns).find(([, pattern]) =>
        pattern.test(location.pathname),
      )?.[0] ?? 'games'
    );
  }, [location.pathname]);

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const revalidatorRef = useRef(revalidator);
  useEffect(() => {
    revalidatorRef.current = revalidator;
  }, [revalidator]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWhileBusyRef = useRef(false);
  const pendingInitialRef = useRef(false);

  const sessionId = session?.id;
  const sessionStatus = session?.status;
  const isCompFinalizing =
    sessionStatus === 'complete' &&
    Boolean(session?.compTracking?.enabled) &&
    Boolean(session?.compTracking?.start) &&
    !session?.compTracking?.end;
  const shouldSubscribe =
    Boolean(sessionId) && (sessionStatus === 'pending' || isCompFinalizing);

  const scheduleRevalidate = useCallback((initial: boolean) => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    pendingInitialRef.current = initial;
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const currentRevalidator = revalidatorRef.current;
      if (currentRevalidator.state !== 'idle') {
        pendingWhileBusyRef.current = true;
        return;
      }
      pendingWhileBusyRef.current = false;
      const isInitialTrigger = pendingInitialRef.current;
      currentRevalidator
        .revalidate()
        .then(() =>
          log.debug({
            action: 'firestore.revalidated',
            message: isInitialTrigger
              ? 'Firestore session snapshot revalidated (initial)'
              : 'Firestore session snapshot revalidated',
            initial: isInitialTrigger,
          }),
        )
        .catch((err) => {
          log.error({
            action: 'firestore.revalidate',
            message: isInitialTrigger
              ? 'Failed to revalidate on initial firestore snapshot'
              : 'Failed to revalidate on firestore update',
            initial: isInitialTrigger,
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }, SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (!sessionId || !shouldSubscribe) {
      return;
    }

    let isInitial = true;
    const unsubscribe = onSnapshot(
      doc(db, 'sessions', sessionId),
      (snapshot) => {
        const newData = snapshot.data() as FirestoreSessionData | undefined;
        if (!newData) return;

        if (isInitial) {
          isInitial = false;
          const current = sessionRef.current as
            | FirestoreSessionData
            | undefined;
          const currentCount = current?.aggregateIds?.length ?? 0;
          const newCount = newData.aggregateIds?.length ?? 0;
          const statusChanged = newData.status !== current?.status;
          const activityChanged =
            Boolean(newData.lastSeenActivityId) &&
            newData.lastSeenActivityId !== current?.lastSeenActivityId;
          const compFinalized =
            Boolean(newData.compTracking?.end) && !current?.compTracking?.end;

          if (
            statusChanged ||
            newCount !== currentCount ||
            activityChanged ||
            compFinalized
          ) {
            scheduleRevalidate(true);
          }
          return;
        }

        scheduleRevalidate(false);
      },
      (error) => {
        log.error({
          action: 'firestore.snapshot_error',
          message: 'Firestore session onSnapshot error',
          error: error instanceof Error ? error.message : String(error),
        });
      },
    );

    return () => {
      unsubscribe();
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pendingWhileBusyRef.current = false;
    };
  }, [sessionId, shouldSubscribe, scheduleRevalidate]);

  useEffect(() => {
    if (revalidator.state === 'idle' && pendingWhileBusyRef.current) {
      pendingWhileBusyRef.current = false;
      scheduleRevalidate(false);
    }
  }, [revalidator.state, scheduleRevalidate]);

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <title>Session Not Found | 1 Trick</title>
        <meta
          name="description"
          content="We couldn't load this session on 1 Trick."
        />
        <Empty
          title="No Session Found"
          description="Error loading this session. Please try again later."
        />
      </div>
    );
  }

  if (error) {
    log.error({
      action: 'session.loader_error',
      message: 'Session loader error',
      error,
    });
    return (
      <div>
        <title>Error Loading Session | 1 Trick</title>
        <meta
          name="description"
          content="Error loading this session on 1 Trick."
        />
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

  return (
    <div className="flex flex-col gap-4">
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
          characterId={characterId}
        />

        <Tabs value={currentTab} className="mt-6 sm:mt-8">
          <TabsList>
            <TabsTrigger value="games" asChild>
              <NavLink to="." end prefetch="intent">
                Games
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="metrics" asChild>
              <NavLink to="metrics" prefetch="intent">
                Metrics
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="loadouts" asChild>
              <NavLink to="loadouts" prefetch="intent">
                Loadouts
              </NavLink>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div
        aria-busy={isSwitchingTab}
        className={cn(
          'w-full overflow-x-hidden transition-opacity duration-150',
          isSwitchingTab && 'opacity-60',
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default Session;
