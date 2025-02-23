import { AlertCircle, SquareArrowOutUpRight } from 'lucide-react';
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
import { isEmptyObject } from '~/lib/utils';

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
  if (!res.data || isEmptyObject(res.data)) {
    throw data('Record Not Found', { status: 404 });
  }
  return { data: res.data, characterId };
}

export function meta({ data }: Route.MetaArgs) {
  const {
    data: { activity },
  } = data;
  return [
    { title: `One Trick - ${activity.mode}` },
    {
      name: 'description',
      content: `Details about ${activity.location} - ${activity.mode}`,
    },
  ];
}
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <div>Oops, something went wrong!</div>;
}

const destinyTrackerUrl = 'https://destinytracker.com/destiny-2/pgcr';
const crucibleReportUrl = 'https://crucible.report/pgcr/';

export default function Activity() {
  const { data, characterId } = useLoaderData<typeof loader>();
  const characterData = data.aggregate?.performance[characterId];
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.activity.mode}</CardTitle>
          <CardDescription>{data.activity.location}</CardDescription>
          <div className="flex flex-row gap-4">
            <div className="flex flex-row items-center gap-2 align-middle">
              <a
                className="text-blue-500 hover:underline"
                href={`${destinyTrackerUrl}/${data.activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Destiny Tracker
              </a>
              <SquareArrowOutUpRight className="h-4 w-4" />
            </div>
            <div className="flex flex-row items-center gap-2">
              <a
                className="text-blue-500 hover:underline"
                href={`${crucibleReportUrl}/${data.activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Crucible Report
              </a>
              <SquareArrowOutUpRight className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <div className="flex flex-col gap-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Weapons
        </h3>
        <div className="flex flex-row gap-6">
          {Object.values(characterData?.weapons ?? {}).length === 0 && (
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
          {Object.values(characterData?.weapons ?? {}).map((it) => (
            <Card key={it.referenceId}>
              <CardHeader>
                <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
                  {it.properties?.baseInfo?.name}
                </h3>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <div className="pb-2 font-bold">Perks</div>
                  {it.properties?.perks?.map((it) => (
                    <div key={it.hash}>
                      <div>{it.name}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="pb-2 font-bold">Sockets</div>
                  {it.properties?.sockets?.map((it) => (
                    <div key={it.plugHash}>
                      <div>{it.name}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="pb-2 font-bold">Stats</div>
                  {it.properties?.stats &&
                    Object.values(it.properties?.stats).map((it) => (
                      <div key={it.hash} className="grid grid-cols-2 gap-2">
                        <div>{it.name}</div>
                        <div>{it.value}</div>
                      </div>
                    ))}
                </div>
                <div>
                  <div className="pb-2 font-bold">Kills</div>
                  {Object.values(it.stats ?? {})?.map((value) => (
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
