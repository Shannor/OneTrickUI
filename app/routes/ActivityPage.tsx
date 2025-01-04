import React from 'react';
import type { Route } from './+types/ActivityPage';
import { apiClient, getActivity } from '~/api';
import { data, useLoaderData } from 'react-router';

export async function loader({ params }: Route.LoaderArgs) {
  const res = await getActivity({
    path: { activityId: params.instanceId },
    client: apiClient,
  });
  if (!res.data) {
    throw data('Record Not Found', { status: 404 });
  }
  return res.data;
}
export default function ActivityPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <div>{data.activity.instanceId}</div>
      {data.stats.map((it) => (
        <div key={it.referenceId}>{it.details?.baseInfo?.name}</div>
      ))}
    </div>
  );
}
