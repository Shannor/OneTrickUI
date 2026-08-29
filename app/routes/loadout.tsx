import { format } from 'date-fns';
import React from 'react';
import { NavLink, Outlet, data, useLocation, useParams } from 'react-router';
import { getSnapshot } from '~/api';
import { LoadoutHeaderActions } from '~/components/loadout-header-actions';
import { LoadoutUpdateForm } from '~/components/loadout-update-form';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useProfileData } from '~/hooks/use-route-loaders';
import { Logger } from '~/lib/logger';

import type { Route } from './+types/loadout';

export async function loader({ params }: Route.LoaderArgs) {
  const { snapshotId, id, characterId } = params;
  const { data: snapshot, error } = await getSnapshot({
    path: { snapshotId },
  });
  if (error) {
    Logger.error(error, 'Failed to fetch snapshot in loadout loader');
    throw data('Unexpected Error', { status: 500 });
  }
  if (!snapshot) {
    throw data('Record Not Found', { status: 404 });
  }

  const sharablePath = `profile/${id}/c/${characterId}/loadouts/${snapshotId}`;
  let path: string;
  if (process.env.NODE_ENV === 'development') {
    path = `https://local.d2onetrick.ngrok.app/${sharablePath}`;
  } else {
    path = `https://d2onetrick.com/${sharablePath}`;
  }

  return {
    snapshot,
    path,
  };
}

export function Loadout({ loaderData }: Route.ComponentProps) {
  const { snapshot, path } = loaderData;
  const { profile, type } = useProfileData();
  const { characterId } = useParams();
  const isOwner = type === 'owner';
  const location = useLocation();

  const currentTab = React.useMemo(() => {
    const tabPatterns = {
      metrics: /\/metrics\/?$/,
      loadout: /.*/,
    };

    return (
      Object.entries(tabPatterns).find(([_, pattern]) =>
        pattern.test(location.pathname),
      )?.[0] ?? 'loadout'
    );
  }, [location.pathname]);

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
