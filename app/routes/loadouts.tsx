import { useRef } from 'react';
import { Form, useLocation, useNavigate } from 'react-router';
import { type GameMode, getBestPerformingLoadouts } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutCard } from '~/components/loadout-card';
import { FormLabel } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useProfileData } from '~/hooks/use-route-loaders';
import { Logger } from '~/lib/logger';

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
    Logger.error(error, 'Failed to fetch best performing loadouts');
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
          title="Get in the Crucible!"
          description="Play more games so your top loadouts will start showing up!"
        />
      )}
      <div className="grid grid-cols-1 gap-4">
        {loadouts?.items?.map((snapshot) => (
          <LoadoutCard
            key={snapshot.id}
            snapshot={snapshot}
            stats={loadouts.stats[snapshot.id]}
            gamesCount={loadouts.count[snapshot.id] ?? 0}
            onClick={() => navigate(`${snapshot.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
