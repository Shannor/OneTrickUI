import { SquareArrowOutUpRight } from 'lucide-react';
import React from 'react';
import { data } from 'react-router';
import { getActivity } from '~/api';
import { Label } from '~/components/label';
import { TeamScore } from '~/components/team-score';
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
  if (!params.instanceId) {
    throw new Error('Missing instance id');
  }
  const url = new URL(request.url);
  const selectedCharacterId = url.searchParams.get('characterId');

  const res = await getActivity({
    path: { activityId: params.instanceId },
  });

  if (!res.data || isEmptyObject(res.data)) {
    throw data('Record Not Found', { status: 404 });
  }
  return { activityDetails: res.data, characterId: selectedCharacterId };
}

const destinyTrackerUrl = 'https://destinytracker.com/destiny-2/pgcr';
const crucibleReportUrl = 'https://crucible.report/pgcr';

export default function Activity({ loaderData }: Route.ComponentProps) {
  const {
    activityDetails: { activity, aggregate, teams, snapshots, users },
    characterId,
  } = loaderData;

  // const selectedCharacterId = characterId;
  // const performance = aggregate?.performance[selectedCharacterId];
  // const link = aggregate?.snapshotLinks[selectedCharacterId];

  const allPerformances = Object.entries(aggregate?.performance ?? {});
  const snapshotEntries = Object.entries(snapshots ?? {});

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="relative">
          <img
            src={activity.imageUrl}
            alt="activity background"
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20" />
          <CardHeader className="relative z-10 text-white">
            <div className="flex items-center gap-4">
              {activity.activityIcon && (
                <img
                  src={activity.activityIcon}
                  className="h-12 w-12 rounded-lg bg-black/50 object-cover"
                  alt="mode icon"
                />
              )}
              <div className="flex flex-col">
                <CardTitle className="text-2xl">{activity.location}</CardTitle>
                <CardDescription className="text-neutral-200">
                  {activity.activity}
                  {activity.mode ? ` • ${activity.mode}` : ''}
                </CardDescription>
              </div>
              <div className="ml-auto">
                <span className="rounded bg-white/10 px-2 py-1 text-xs uppercase tracking-wide">
                  {new Date(activity.period as any).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <TeamScore teams={teams} />
            </div>
            <div className="mt-2 flex flex-row gap-4">
              <div className="flex flex-row items-center gap-2 align-middle">
                <a
                  className="text-blue-300 underline-offset-2 hover:underline"
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
                  className="text-blue-300 underline-offset-2 hover:underline"
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
        </div>
      </Card>
      {/*<SnapshotLinkDetails link={link} />*/}

      {/* All Players Stats */}
      <div className="flex flex-col gap-4 p-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          All Players
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {allPerformances.map(([charId, perf]) => {
            const stats = perf.playerStats;
            // const isSelected = charId === selectedCharacterId;
            return (
              <Card
                key={charId}
                // className={isSelected ? 'ring-2 ring-blue-500' : ''}
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                      <div className="text-sm text-muted-foreground">
                        Player
                      </div>
                      <div className="font-semibold">
                        {users[charId]?.displayName ?? 'Unknown Player'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div>
                      <Label>Kills</Label>
                      <div className="font-semibold">
                        {stats.kills?.displayValue ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label>Deaths</Label>
                      <div className="font-semibold">
                        {stats.deaths?.displayValue ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label>Assists</Label>
                      <div className="font-semibold">
                        {stats.assists?.displayValue ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label>KD/A</Label>
                      <div className="font-semibold">
                        {stats.kda?.displayValue ?? 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label>K/D</Label>
                      <div className="font-semibold">
                        {stats.kd?.displayValue ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Snapshots for any characters that have them */}
      {snapshotEntries.length > 0 && (
        <div className="flex flex-col gap-4 p-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Snapshots
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {snapshotEntries.map(([charId, snap]) => {
              const isSelected = charId === characterId;
              const items = Object.values(snap.loadout ?? {});
              return (
                <Card
                  key={snap.id}
                  className={isSelected ? 'ring-2 ring-blue-500' : ''}
                >
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex flex-col">
                        <div className="text-sm text-muted-foreground">
                          Player
                        </div>
                        <div className="font-semibold">
                          {users[charId]?.displayName ?? 'Unknown Player'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                      <div className="font-semibold">{snap.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Updated{' '}
                        {new Date(snap.updatedAt as any).toLocaleString()}
                      </div>
                    </div>
                    {items.length > 0 && (
                      <div className="flex flex-row flex-wrap gap-2">
                        {items.map((it) => (
                          <div
                            key={it.instanceId}
                            className="rounded bg-muted px-2 py-1 text-xs"
                          >
                            {it.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Player Weapons */}
      {/*<div className="flex flex-col gap-4 p-4">*/}
      {/*  <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">*/}
      {/*    Weapons*/}
      {/*  </h3>*/}
      {/*  <div className="flex flex-row gap-6">*/}
      {/*    {Object.values(performance?.weapons ?? {}).map((it) => (*/}
      {/*      <Weapon key={it.referenceId} {...it} />*/}
      {/*    ))}*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  );
}
