import { format } from 'date-fns';
import React from 'react';
import {
  Link,
  NavLink,
  Outlet,
  type ShouldRevalidateFunctionArgs,
  redirect,
  useLocation,
  useParams,
} from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { getCachedSimilarSnapshots } from '~/.server/snapshots';
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

  const auth = request ? await getAuth(request) : undefined;
  const isOwner = Boolean(auth?.id && auth.id === id);

  const [{ data: snapshot, error }, similarRes] = await Promise.all([
    getSnapshot({
      path: { snapshotId },
    }),
    isOwner
      ? getCachedSimilarSnapshots(request, snapshotId).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (error) {
    log.error('Failed to fetch snapshot in loadout loader', {
      snapshot: { id: snapshotId, error },
    });
    return {
      snapshot: undefined,
      error: 'Failed to load loadout',
      path,
      similarCount: 0,
    };
  }
  if (!snapshot) {
    log.set({ snapshot: { id: snapshotId, found: false } });
    return {
      snapshot: undefined,
      error: 'Loadout Not Found',
      path,
      similarCount: 0,
    };
  }

  if (snapshot.mergedIntoId) {
    return redirect(
      `/profile/${id}/c/${characterId}/loadouts/${snapshot.mergedIntoId}`,
    );
  }

  const similarCount = similarRes?.data?.items?.length ?? 0;

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
          />
        </div>

        {isOwner ? (
          <LoadoutUpdateForm
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
                {similarCount > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                    {similarCount}
                  </span>
                )}
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
