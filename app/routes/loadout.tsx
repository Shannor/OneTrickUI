import { format } from 'date-fns';
import React from 'react';
import { Form, NavLink, Outlet, data, useLocation } from 'react-router';
import { getSnapshot } from '~/api';
import { LoadingButton } from '~/components/loading-button';
import { Input } from '~/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';
import { useProfileData } from '~/hooks/use-route-loaders';

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
  const { profile, type } = useProfileData();
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
    <div className="flex flex-col gap-10">
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
      <div className="flex w-full flex-row justify-between gap-4">
        <div className="flex w-full flex-col gap-2">
          {isOwner ? (
            <div className="flex w-full flex-row gap-4">
              <Form
                method="post"
                action="/action/update-loadout"
                className="flex w-full flex-col gap-4 lg:w-1/2 xl:w-1/3"
              >
                <Input
                  name="name"
                  defaultValue={snapshot.name ?? ''}
                  className="h-auto scroll-m-20 border-none bg-transparent px-1 py-2 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-3xl"
                />
                <input type="hidden" name="snapshotId" value={snapshot.id} />
                <Textarea
                  name="description"
                  placeholder="Add a description..."
                  className="w-full"
                  defaultValue={snapshot.description}
                />
                <LoadingButton type="submit">Save</LoadingButton>
              </Form>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-4">
              <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                {snapshot.name ?? ''}
              </h2>
              {snapshot.description && (
                <div className="text-sm text-muted-foreground">
                  {snapshot.description}
                </div>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Created on {format(new Date(snapshot.createdAt), 'MMMM d, yyyy')}
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
