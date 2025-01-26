import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, data, useLoaderData, useNavigate } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { type ActivityMode, getActivities } from '~/api';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

import type { Route } from './+types/activities';

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
  const page = Number(url.searchParams.get('page') || '0');
  const activityType = url.searchParams.get('type') as ActivityMode | null;

  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const { characterId } = await getPreferences(request);
  if (!characterId) {
    return { data: [], page, error: 'No character id', activityType };
  }

  const res = await getActivities({
    query: {
      count: 10,
      page: page,
      characterId,
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

  return { data: res.data, page, activityType };
}

export default function Activities() {
  const navigate = useNavigate();
  const { data, page, activityType } = useLoaderData<typeof loader>();

  console.log(page, typeof page, page === 0);
  const noActivities = data?.length === 0;
  return (
    <div className="flex flex-col gap-4 pb-6">
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {getTitle(activityType)}
      </h2>
      {data?.map((activity) => (
        <Card
          key={activity.instanceId}
          onClick={() => navigate(`/activities/${activity.instanceId}`)}
        >
          <CardHeader>
            <CardTitle>{activity.location}</CardTitle>
            <CardDescription>
              {activity.activity} - {activity.mode}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
      <div>{noActivities && <p>No activities found</p>}</div>
      <div className="flex flex-row gap-4 justify-between self-end">
        <Button disabled={page === 0} variant="outline">
          <ChevronLeft />
          <Link to={`/activities?page=${page - 1}`}> Previous Page</Link>
        </Button>
        <Button disabled={noActivities} variant="outline">
          <Link to={`/activities?page=${page + 1}`}>Next Page</Link>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function getTitle(activityType: ActivityMode | null) {
  if (!activityType) {
    return 'All PvP';
  }
  switch (activityType) {
    case 'allPvP':
      return `All PvP`;
    case 'competitive':
      return `Competitive`;
    case 'ironBanner':
      return `Iron Banner`;
    case 'quickplay':
      return `Quick Play`;
    default:
      return 'All PvP';
  }
}
