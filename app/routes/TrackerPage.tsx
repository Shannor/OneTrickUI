import { getActivities } from '~/api/client/sdk.gen';
import type { Route } from './+types/TrackerPage';
import { apiClient } from '~/api/client';
import { data, useLoaderData, useNavigate } from 'react-router';

export async function loader({ params }: Route.LoaderArgs) {
  const res = await getActivities({
    query: {
      count: 10,
      page: 0,
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
      <header className="flex flex-wrap sm:justify-start sm:flex-nowrap w-full bg-white text-sm py-3 dark:bg-neutral-800">
        <nav className="max-w-[85rem] w-full mx-auto px-4 sm:flex sm:items-center sm:justify-between">
          <a
            className="flex-none font-semibold text-xl text-black focus:outline-none focus:opacity-80 dark:text-white"
            href="#"
            aria-label="Brand"
          >
            One Trick
          </a>
        </nav>
      </header>
      {data?.map((activity, index) => (
        <div
          key={activity.instanceId || index}
          className="flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl p-4 md:p-5 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
          onClick={() => navigate(`/tracker/${activity.instanceId}`)}
        >
          {activity.instanceId}
        </div>
      ))}
    </div>
  );
}
