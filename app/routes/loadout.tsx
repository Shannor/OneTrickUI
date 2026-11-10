import { format } from 'date-fns';
import React from 'react';
import {
  Link,
  NavLink,
  Outlet,
  type ShouldRevalidateFunctionArgs,
  useLocation,
  useParams,
} from 'react-router';
import { getRequestLogger } from '~/.server/logger';
import { getSnapshot } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutHeaderActions } from '~/components/loadout-header-actions';
import { LoadoutUpdateForm } from '~/components/loadout-update-form';
import { Button } from '~/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useProfileData } from '~/hooks/use-route-loaders';

import type { Route } from './+types/loadout';

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { snapshotId, id, characterId } = params;
  log.set({
    route: 'routes/loadout',
    snapshot: { id: snapshotId, userId: id, characterId },
  });

  const sharablePath = `profile/${id}/c/${characterId}/loadouts/${snapshotId}`;
  const path =
    process.env.NODE_ENV === 'development'
      ? `https://local.d2onetrick.ngrok.app/${sharablePath}`
      : `https://d2onetrick.com/${sharablePath}`;

  const { data: snapshot, error } = await getSnapshot({
    path: { snapshotId },
  });
  if (error) {
    log.error('Failed to fetch snapshot in loadout loader', {
      snapshot: { id: snapshotId, error },
    });
    return {
      snapshot: undefined,
      error: 'Failed to load loadout',
      path,
    };
  }
  if (!snapshot) {
    log.set({ snapshot: { id: snapshotId, found: false } });
    return {
      snapshot: undefined,
      error: 'Loadout Not Found',
      path,
    };
  }

  return {
    snapshot,
    error: undefined,
    path,
  };
}

// Built-in React Router route module export that controls when this layout's loader re-runs on navigation
export function shouldRevalidate({
  currentParams,
  nextParams,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod && formMethod !== 'GET') {
    return defaultShouldRevalidate;
  }
  return currentParams.snapshotId !== nextParams.snapshotId;
}

export function Loadout({ loaderData }: Route.ComponentProps) {
  const { snapshot, error, path } = loaderData;
  const { profile, type } = useProfileData();
  const { id, characterId } = useParams();
  const isOwner = type === 'owner';
  const location = useLocation();

  const currentTab = React.useMemo(() => {
    const tabPatterns = {
      metrics: /\/metrics\/?$/,
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
      <title>{`${snapshot.name ?? 'Snapshot'} - Loadout & Metrics`}</title>
      <meta
        property="og:title"
        content={`${snapshot.name ?? 'Snapshot'} - Loadout & Metrics`}
      />
      <meta
        name="description"
        content={
          snapshot.description ??
          `View the loadout and performance metrics for ${snapshot.name ?? 'this snapshot'}.`
        }
      />
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
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  );
}

export default Loadout;
