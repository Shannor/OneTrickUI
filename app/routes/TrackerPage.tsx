import { getActivities } from '~/api/client/sdk.gen';
import type { Route } from './+types/TrackerPage';
import { apiClient } from '~/api/client';
import { data, useLoaderData, useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = url.searchParams.get('page') || '0';
  const res = await getActivities({
    query: {
      count: 10,
      page: Number(page),
    },
    client: apiClient,
  });

  if (!res.data) {
    throw data('No records found', { status: 404 });
  }

  return res.data;
}
export default function TrackerPage() {
  const navigate = useNavigate();
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      {data?.map((activity, index) => (
        <div
          key={activity.instanceId}
          className="flex cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 md:p-5"
          onClick={() => navigate(`/tracker/${activity.instanceId}`)}
        >
          <div className="text-xl dark:text-white">{activity.name}</div>
          <div className="text-base dark:text-white">
            {activity.description}
          </div>
        </div>
      ))}
    </div>
  );
}
