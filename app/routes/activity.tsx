import { AlertCircle } from 'lucide-react';
import React from 'react';
import { data, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { getActivity } from '~/api';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

import type { Route } from './+types/activity';

export async function loader({ params, request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }
  const { characterId } = await getPreferences(request);
  if (characterId === undefined) {
    throw data('No character id', { status: 404 });
  }
  const res = await getActivity({
    path: { activityId: params.instanceId },
    query: {
      characterId,
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (!res.data) {
    throw data('Record Not Found', { status: 404 });
  }
  return res.data;
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `One Trick - ${data.activity.mode}` },
    {
      name: 'description',
      content: `Details about ${data.activity.location} - ${data.activity.mode}`,
    },
  ];
}

const destinyTrackerUrl = 'https://destinytracker.com/destiny-2/pgcr';
const crucibleReportUrl = 'https://crucible.report/pgcr/';
export default function Activity() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.activity.mode}</CardTitle>
          <CardDescription>{data.activity.location}</CardDescription>
          <div className="flex flex-row gap-4">
            <a
              href={`${destinyTrackerUrl}/${data.activity.instanceId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Destiny Tracker Link
            </a>
            <a
              href={`${crucibleReportUrl}/${data.activity.instanceId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Crucible Report Link
            </a>
          </div>
        </CardHeader>
      </Card>
      <div className="flex flex-col gap-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Weapons
        </h3>
        <div className="flex flex-row gap-6">
          {data.stats.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                <p>
                  Couldn't find any weapons for this activity. This is likely
                  due to not having a matching snapshot at this time.
                </p>
                <p>
                  In the future, we will be able to show you weapons that we saw
                  you using and you can manually select the weapons that you
                  think match it.
                </p>
              </AlertDescription>
            </Alert>
          )}
          {data.stats.map((it) => (
            <Card key={it.referenceId}>
              <CardHeader>
                <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
                  {it.details?.baseInfo?.name}
                </h3>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <div className="pb-2 font-bold">Perks</div>
                  {it.details?.perks?.map((it) => (
                    <div key={it.hash}>
                      <div>{it.name}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="pb-2 font-bold">Sockets</div>
                  {it.details?.sockets?.map((it) => (
                    <div key={it.plugHash}>
                      <div>{it.name}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="pb-2 font-bold">Stats</div>
                  {it.details?.stats &&
                    Object.values(it.details?.stats).map((it) => (
                      <div key={it.hash} className="grid grid-cols-2 gap-2">
                        <div>{it.name}</div>
                        <div>{it.value}</div>
                      </div>
                    ))}
                </div>
                <div>
                  <div className="pb-2 font-bold">Kills</div>
                  {it.stats?.map((value) => (
                    <div key={value.name} className="grid grid-cols-2 gap-2">
                      <div>{value.name}</div>
                      <div>{value.basic?.displayValue}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
