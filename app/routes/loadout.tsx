import { format } from 'date-fns';
import type { AuditableLogger } from 'evlog';
import React, { Suspense } from 'react';
import {
  Await,
  Link,
  NavLink,
  Outlet,
  type ShouldRevalidateFunctionArgs,
  redirect,
  useLocation,
  useParams,
} from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger, runWithForkedLogger } from '~/.server/logger';
import {
  getCachedSimilarSnapshots,
  requestTargetsSimilarRoute,
} from '~/.server/snapshots';
import { getSnapshot } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutHeaderActions } from '~/components/loadout-header-actions';
import { LoadoutUpdateForm } from '~/components/loadout-update-form';
import { Button } from '~/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useProfileData } from '~/hooks/use-route-loaders';

import type { Route } from './+types/loadout';

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { snapshotId, id, characterId } = params;
  log.set({
    route: 'routes/loadout',
    snapshot: { id: snapshotId, userId: id, characterId },
  });

  const sharablePath = `profile/${id}/c/${characterId}/loadouts/${snapshotId}`;
  const devOrigin = request
    ? new URL(request.url).origin
    : 'http://localhost:5173';
  const path =
    process.env.NODE_ENV === 'development'
      ? `${devOrigin}/${sharablePath}`
      : `https://d2onetrick.com/${sharablePath}`;

  const [auth, { data: snapshot, error }] = await Promise.all([
    request ? getAuth(request) : Promise.resolve(undefined),
    getSnapshot({
      path: { snapshotId },
    }),
  ]);
  const isOwner = Boolean(auth?.id && auth.id === id);

  if (error) {
    log.error('Failed to fetch snapshot in loadout loader', {
      snapshot: { id: snapshotId, error },
    });
    return {
      snapshot: undefined,
      error: 'Failed to load loadout',
      path,
      similarCount: 0 as number | Promise<number>,
    };
  }
  if (!snapshot) {
    log.set({ snapshot: { id: snapshotId, found: false } });
    return {
      snapshot: undefined,
      error: 'Loadout Not Found',
      path,
      similarCount: 0 as number | Promise<number>,
    };
  }

  if (snapshot.mergedIntoId) {
    return redirect(
      `/profile/${id}/c/${characterId}/loadouts/${snapshot.mergedIntoId}`,
    );
  }

  const targetsSimilarRoute = Boolean(
    request && requestTargetsSimilarRoute(request),
  );

  const fetchSimilarCount = async (
    targetLog: AuditableLogger,
  ): Promise<number> => {
    try {
      const res = await getCachedSimilarSnapshots(request, snapshotId);
      if (res.error) {
        targetLog.error(
          'Failed to fetch similar snapshots count in loadout loader',
          {
            snapshot: { id: snapshotId, error: res.error },
          },
        );
        return 0;
      }
      const count = res.data?.items?.length ?? 0;
      targetLog.set({
        snapshot: {
          id: snapshotId,
          userId: id,
          characterId,
          similarCount: count,
        },
      });
      return count;
    } catch (err) {
      targetLog.error(
        err instanceof Error
          ? err
          : 'Failed to fetch similar snapshots count in loadout loader',
        { snapshot: { id: snapshotId, userId: id, characterId } },
      );
      return 0;
    }
  };

  const similarCount: number | Promise<number> = isOwner
    ? targetsSimilarRoute
      ? await fetchSimilarCount(log)
      : runWithForkedLogger(log, 'loadout.similar_count', fetchSimilarCount)
    : 0;

  return {
    snapshot,
    error: undefined,
    path,
    similarCount,
  };
}

// Built-in React Router route module export that controls when this layout's loader re-runs on navigation
export function shouldRevalidate({
  currentParams,
  nextParams,
  formMethod,
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod && formMethod !== 'GET') {
    if (
      actionResult &&
      typeof actionResult === 'object' &&
      'ok' in actionResult &&
      actionResult.ok === false
    ) {
      return false;
    }
    return defaultShouldRevalidate;
  }
  return currentParams.snapshotId !== nextParams.snapshotId;
}

export function SimilarCountBadge({
  snapshotId,
  similarCount,
}: {
  snapshotId?: string;
  similarCount: number | Promise<number>;
}) {
  return (
    <Suspense key={snapshotId} fallback={null}>
      <Await resolve={similarCount} errorElement={<></>}>
        {(count) =>
          count > 0 ? (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {count}
            </span>
          ) : null
        }
      </Await>
    </Suspense>
  );
}

export function Loadout({ loaderData }: Route.ComponentProps) {
  const { snapshot, error, path, similarCount = 0 } = loaderData;
  const { profile, type } = useProfileData();
  const { id, characterId } = useParams();
  const isOwner = type === 'owner';
  const location = useLocation();

  const currentTab = React.useMemo(() => {
    const tabPatterns = {
      metrics: /\/metrics\/?$/,
      similar: /\/similar\/?$/,
      loadout: /.*/,
    };

    return (
      Object.entries(tabPatterns).find(([, pattern]) =>
        pattern.test(location.pathname),
      )?.[0] ?? 'loadout'
    );
  }, [location.pathname]);

  if (!snapshot || error) {
    return (
      <div className="flex flex-col gap-4">
        <title>Loadout Not Found | 1 Trick</title>
        <meta
          name="description"
          content="We couldn't load this loadout snapshot on 1 Trick."
        />
        <Empty
          title="No Loadout Found"
          description="We couldn't load this loadout snapshot. Please try again later."
        >
          <Button asChild variant="outline">
            <Link to={`/profile/${id}/c/${characterId}/loadouts`}>
              Back to Loadouts
            </Link>
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Created on {format(new Date(snapshot.createdAt), 'MMMM d, yyyy')}
          </p>
          <LoadoutHeaderActions
            isOwner={isOwner}
            snapshotId={snapshot.id}
            snapshotName={snapshot.name}
            characterId={characterId}
            userId={profile?.id}
            shareUrl={path}
            loadout={snapshot.loadout}
          />
        </div>

        {isOwner ? (
          <LoadoutUpdateForm
            key={snapshot.id}
            snapshotId={snapshot.id}
            defaultName={snapshot.name}
            defaultDescription={snapshot.description}
          />
        ) : (
          <div className="flex w-full flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {snapshot.name ?? ''}
            </h2>
            {snapshot.description && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {snapshot.description}
              </p>
            )}
          </div>
        )}
      </div>
      <Tabs value={currentTab}>
        <TabsList>
          <TabsTrigger value="loadout" asChild>
            <NavLink to="." end>
              Loadout
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="metrics" asChild>
            <NavLink to="metrics">Metrics</NavLink>
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="similar" asChild>
              <NavLink to="similar" className="flex items-center gap-1.5">
                <span>Similar</span>
                <SimilarCountBadge
                  key={snapshot.id}
                  snapshotId={snapshot.id}
                  similarCount={similarCount}
                />
              </NavLink>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  );
}

export default Loadout;
