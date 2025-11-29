import { format } from 'date-fns';
import React from 'react';
import { NavLink, Outlet, data, useLocation } from 'react-router';
import { getSnapshot } from '~/api';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';

import type { Route } from './+types/loadout';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { snapshotId } = params;
  const { data: snapshot, error } = await getSnapshot({
    path: { snapshotId },
  });
  if (error) {
    console.error(error);
    throw data('Unexpected Error', { status: 500 });
  }
  if (!snapshot) {
    throw data('Record Not Found', { status: 404 });
  }
  return {
    snapshot,
  };
}

export default function Loadout({ loaderData }: Route.ComponentProps) {
  const { snapshot } = loaderData;
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
    <div className="flex flex-col gap-10">
      <title>{`${snapshot.name ?? 'Snapshot'} - Loadout & Metrics`}</title>
      <meta
        property="og:title"
        content={`${snapshot.name ?? 'Snapshot'} - Loadout & Metrics`}
      />
      <meta
        name="description"
        content={`View the loadout and performance metrics for ${snapshot.name ?? 'this snapshot'}.`}
      />
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {snapshot.name ?? 'Snapshot'}
          </h2>
          <p>
            Started Recording on{' '}
            {format(new Date(snapshot.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
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
