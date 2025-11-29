import React, { useRef } from 'react';
import { Form, useLocation, useNavigate } from 'react-router';
import { type GameMode, getBestPerformingLoadouts } from '~/api';
import { ArmorStats } from '~/components/armor-stats';
import { Empty } from '~/components/empty';
import { ItemSnapshot } from '~/components/item-snapshot';
import { Label } from '~/components/label';
import { Super } from '~/components/sub-class';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { FormLabel } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { WeaponStats } from '~/components/weapon-stats';
import { useClassStats, useExotic, useWeapons } from '~/hooks/use-loadout';
import { useProfileData } from '~/hooks/use-route-loaders';
import { cn } from '~/lib/utils';
import { Performance, type StatItem } from '~/organisims/performance';
import { SubClassProvider } from '~/providers/sub-class-provider';

import type { Route } from './+types/loadouts';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const { id: userId, characterId } = params;
  const mode = (url.searchParams.get('mode') ?? 'allGameModes') as GameMode;
  const countParam = url.searchParams.get('count');
  const minParams = url.searchParams.get('minimum');

  let minimumGames = 5;
  if (minParams && minParams != '') {
    minimumGames = Number(minParams);
  }
  let count = 10;
  if (countParam && countParam != '') {
    count = Number(countParam);
  }
  const { data: bestPerforming, error } = await getBestPerformingLoadouts({
    query: {
      characterId,
      userId,
      gameMode: mode,
      count,
      minimumGames,
    },
  });
  if (error) {
    console.error(error);
    return {
      loadouts: {
        items: [],
        count: {},
        stats: {},
      },
      gameMode: mode,
      minimumGames: minimumGames,
      count,
    };
  }
  return {
    loadouts: bestPerforming,
    gameMode: mode,
    minimumGames: minimumGames,
    count,
  };
}

export default function Loadouts({ loaderData }: Route.ComponentProps) {
  const { loadouts, gameMode, count, minimumGames } = loaderData;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const ref = useRef<HTMLFormElement>(null);
  const { profile } = useProfileData();

  return (
    <div className="flex w-full flex-col gap-4">
      <title>{`${profile?.displayName ?? ''}'s Top ${count} Loadouts`}</title>
      <meta
        property="og:title"
        content={`${profile?.displayName ?? ''}'s Top ${count} Loadouts`}
      />
      <meta
        name="description"
        content={`Explore ${profile?.displayName ?? ''}'s  top ${count} performing loadouts with filters for mode and minimum games.`}
      />
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Top {count} Loadouts
          </h2>
        </div>
      </div>
      <Form
        action={pathname}
        method="GET"
        className="flex flex-col gap-4"
        ref={ref}
      >
        <RadioGroup
          defaultValue={gameMode}
          className="flex flex-col gap-4 md:flex-row md:items-center"
          name="mode"
          onChange={() => {
            ref.current?.submit();
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="allGameModes" id="all-modes" />
            <FormLabel htmlFor="all-modes">All Modes</FormLabel>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="quickplay" id="quickplay" />
            <FormLabel htmlFor="quickplay">Quickplay</FormLabel>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="competitive" id="comp" />
            <FormLabel htmlFor="comp">Competitive </FormLabel>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="trials" id="trials" />
            <FormLabel htmlFor="trials">Trials</FormLabel>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ironBanner" id="iron-banner" />
            <FormLabel htmlFor="iron-banner">Iron Banner</FormLabel>
          </div>
        </RadioGroup>

        <div className="flex flex-col gap-4 md:flex-row">
          <div>
            <FormLabel htmlFor="minimum">Minimum Games</FormLabel>
            <Select
              defaultValue={minimumGames.toString()}
              name="minimum"
              onValueChange={() => {
                ref.current?.submit();
              }}
            >
              <SelectTrigger className="w-full md:max-w-[200px]">
                <SelectValue placeholder="Minimum Games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FormLabel htmlFor="count">Max Loadouts</FormLabel>
            <Select
              name="count"
              defaultValue={count.toString()}
              onValueChange={() => {
                ref.current?.submit();
              }}
            >
              <SelectTrigger className="w-full md:max-w-[200px]">
                <SelectValue placeholder="Max Loadout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Form>
      {loadouts?.items?.length === 0 && (
        <Empty
          title="No Loadouts Found"
          description="Try starting a session and playing some games to see your loadouts here."
        />
      )}
      <div className="grid grid-cols-1 gap-4">
        {loadouts?.items?.map((snapshot) => {
          const classStats = useClassStats(snapshot);
          const { armor } = useExotic(snapshot?.loadout);
          const data = useWeapons(snapshot?.loadout);
          const kd = loadouts.stats[snapshot.id]?.kd?.value ?? 0;
          const kda = loadouts.stats[snapshot.id]?.kda?.value ?? 0;
          const winRatio = loadouts.stats[snapshot.id]?.standing?.value ?? 0;

          const stats: StatItem[] = [
            { label: 'K/D', value: kd.toFixed(2) },
            { label: 'Efficiency', value: kda.toFixed(2) },
            {
              label: 'Win Ratio',
              value: winRatio.toFixed(2),
              valueClassName:
                winRatio >= 0.5 ? 'text-green-500' : 'text-red-500',
            },
            {
              label: 'Games',
              value: loadouts.count[snapshot.id]?.toString() ?? '0',
            },
          ];
          return (
            <Card
              key={snapshot.id}
              className="cursor-pointer"
              onClick={() => navigate(`${snapshot.id}`)}
            >
              <CardHeader className="flex flex-col gap-4">
                <SubClassProvider snapshot={snapshot}>
                  <Super />
                </SubClassProvider>
                <div className="flex flex-col flex-wrap gap-4 align-top lg:flex-row lg:items-center lg:align-middle">
                  {data.map((item) => (
                    <ItemSnapshot key={item.itemHash} item={item}>
                      <div className="flex flex-col gap-4">
                        <Label
                          className={cn(
                            'truncate',
                            item.details.baseInfo.tierTypeName === 'Exotic'
                              ? 'text-yellow-500'
                              : 'text-purple-500',
                          )}
                        >
                          {item.details.baseInfo.name}
                        </Label>
                        {item.details.stats && (
                          <WeaponStats stats={item.details.stats} />
                        )}
                      </div>
                    </ItemSnapshot>
                  ))}
                  {armor && (
                    <ItemSnapshot item={armor}>
                      <div className="flex flex-col gap-4">
                        <Label className={cn('truncate text-yellow-500')}>
                          {armor.details.baseInfo.name}
                        </Label>
                        {armor.details.stats && (
                          <ArmorStats stats={armor.details.stats} />
                        )}
                      </div>
                    </ItemSnapshot>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-10">
                <Performance
                  stats={stats}
                  className="flex flex-col flex-wrap items-start gap-4 align-top md:flex-row md:items-center md:align-middle"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
