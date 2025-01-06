import type { Route } from './+types/activities';
import { data, useLoaderData, useNavigate } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { getActivities } from '~/api';
export function meta({ location }: Route.MetaArgs) {
  const queryParams = new URLSearchParams(location.search);
  const page = queryParams.get('page') || '';
  return [
    { title: `One Trick - Activities - Page ${page}` },
    {
      name: 'description',
      content: `Details about activities, page ${page}`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = url.searchParams.get('page') || '0';
  const res = await getActivities({
    query: {
      count: 10,
      page: Number(page),
    },
  });

  if (!res.data) {
    throw data('No records found', { status: 404 });
  }

  return res.data;
}

export default function Activities() {
  const navigate = useNavigate();
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      {data?.map((activity) => (
        <Card
          key={activity.instanceId}
          onClick={() => navigate(`/activities/${activity.instanceId}`)}
        >
          <CardHeader>
            <CardTitle>
              {activity.location} - {activity.mode}
            </CardTitle>
            <CardDescription>{activity.activity}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
