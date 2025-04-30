import { SquareArrowOutUpRight } from 'lucide-react';
import React from 'react';
import { data, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { getActivity, getSnapshot } from '~/api';
import { Label } from '~/components/label';
import { TeamScore } from '~/components/team-score';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Weapon } from '~/components/weapon';
import { isEmptyObject } from '~/lib/utils';
import { SnapshotLinkDetails } from '~/organisims/snapshot-link-details';

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
  const link = res.data.aggregate?.snapshotLinks?.[characterId];
  if (link && link.snapshotId) {
    const { data, error } = await getSnapshot({
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'X-User-ID': auth.id,
        'X-Membership-ID': auth.primaryMembershipId,
      },
      path: {
        snapshotId: link.snapshotId,
      },
      query: {
        characterId,
      },
    });
    if (!error) {
      return { activityDetails: res.data, snapshot: data, characterId };
    }
  }
  return { activityDetails: res.data, characterId };
}

export function meta({ data }: Route.MetaArgs) {
  const {
    activityDetails: { activity },
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
const crucibleReportUrl = 'https://crucible.report/pgcr';

export default function Activity() {
  const {
    activityDetails: { activity, aggregate, teams },
    characterId,
  } = useLoaderData<typeof loader>();

  const personalValues = activity.personalValues;
  const performance = aggregate?.performance[characterId];
  const link = aggregate?.snapshotLinks[characterId];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{activity.mode}</CardTitle>
          <CardDescription>{activity.location}</CardDescription>
          <Label
            className="text-lg font-semibold data-[result=0]:text-green-500 data-[result=1]:text-red-500"
            data-result={personalValues?.standing?.value ?? 0}
          >
            {personalValues?.standing?.displayValue}
          </Label>
          <TeamScore teams={teams} />

          <div className="flex flex-row gap-4">
            <div className="flex flex-row items-center gap-2 align-middle">
              <a
                className="text-blue-500 hover:underline"
                href={`${destinyTrackerUrl}/${activity.instanceId}`}
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
                href={`${crucibleReportUrl}/${activity.instanceId}`}
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
      <SnapshotLinkDetails link={link} />

      <div className="flex flex-col gap-4 p-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Weapons
        </h3>
        <div className="flex flex-row gap-6">
          {Object.values(performance?.weapons ?? {}).map((it) => (
            <Weapon key={it.referenceId} {...it} />
          ))}
        </div>
      </div>
    </div>
  );
}
