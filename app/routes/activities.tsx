import type { Route } from './+types/activities';
import { data, useLoaderData, useNavigate } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { type ActivityMode, getActivities } from '~/api';
import { getPreferences } from '~/.server/preferences';
import { getSession } from '~/routes/auth.server';
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
  const activityType = url.searchParams.get('type') as ActivityMode | null;

  const session = await getSession(request.headers.get('Cookie'));
  const auth = session.get('jwt');
  if (!auth) {
    throw new Error('Not authenticated');
  }
  const preferences = await getPreferences(request.headers.get('Cookie'));
  const characterId = preferences.get('characterId');
  if (!characterId) {
    throw data('No character id', { status: 404 });
  }
  const res = await getActivities({
    query: {
      count: 10,
      page: Number(page),
      characterId: characterId,
      mode: activityType || undefined,
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
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
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Activities
      </h2>
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
