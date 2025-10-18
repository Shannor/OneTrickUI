import React, { useRef } from 'react';
import {
  Form,
  data,
  isRouteErrorResponse,
  useLocation,
  useNavigate,
} from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { type GameMode, getBestPerformingLoadouts } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import { Class } from '~/components/class';
import { Empty } from '~/components/empty';
import { Loadout } from '~/components/loadout';
import { Stat } from '~/components/stat';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { FormLabel } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Performance } from '~/organisims/performance';

import type { Route } from './+types/snapshots';

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const characterId = url.searchParams.get('characterId');
  const userId = url.searchParams.get('userId');
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
  if (characterId && userId) {
    const { data: bestPerforming, error } = await getBestPerformingLoadouts({
      query: {
        characterId: characterId,
        userId: userId,
        gameMode: mode,
        count: count,
        minimumGames: minimumGames,
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

  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not logged in');
  }

  const { character } = await getPreferences(request);
  if (!character) {
    throw data('No character');
  }

  const { data: bestPerforming, error } = await getBestPerformingLoadouts({
    query: {
      characterId: character.id,
      userId: auth.id,
      gameMode: mode,
      count: count,
      minimumGames: minimumGames,
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
      count,
      gameMode: mode,
      minimumGames: minimumGames,
    };
  }

  return {
    loadouts: bestPerforming,
    gameMode: mode,
    minimumGames: minimumGames,
    count,
  };
}

export default function Snapshots({ loaderData }: Route.ComponentProps) {
  const { loadouts, gameMode, count, minimumGames } = loaderData;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const ref = useRef<HTMLFormElement>(null);

  return (
    <div className="flex w-full flex-col gap-4">
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
          className="flex items-center gap-4"
          name="mode"
          onChange={(event) => {
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

        <div className="flex flex-row gap-4">
          <div>
            <FormLabel htmlFor="minimum">Minimum Games Required</FormLabel>
            <Select
              defaultValue={minimumGames.toString()}
              name="minimum"
              onValueChange={() => {
                ref.current?.submit();
              }}
            >
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
        {loadouts?.items?.map((snapshot, index) => {
          const values = Object.values(snapshot.stats ?? {})
            .map((stat) => ({
              stat: stat.name,
              value: stat.value ?? 0,
            }))
            .filter((it) => it.stat !== 'Power');
          return (
            <Card
              key={snapshot.id}
              className="cursor-pointer"
              onClick={() => navigate(`/dashboard/loadouts/${snapshot.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex flex-row items-center gap-4">
                  <Loadout snapshot={snapshot} hideStats />
                </CardTitle>
                <CardDescription className="flex flex-col gap-4">
                  <div className="flex flex-row gap-4">
                    <Stat
                      label="Games"
                      value={loadouts.count[snapshot.id]?.toString() ?? '0'}
                    />
                    <Performance
                      rawValues={{
                        kills: loadouts.stats[snapshot.id]?.kills?.value ?? 0,
                        deaths: loadouts.stats[snapshot.id]?.deaths?.value ?? 0,
                        assists:
                          loadouts.stats[snapshot.id]?.assists?.value ?? 0,
                        kd: loadouts.stats[snapshot.id]?.kd?.value ?? 0,
                        kda: loadouts.stats[snapshot.id]?.kda?.value ?? 0,
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-20 md:flex-row">
                    <Class snapshot={snapshot} />
                    <ClassStats data={values} />
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
