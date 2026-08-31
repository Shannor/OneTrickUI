import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { type GameMode, getSnapshots } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutCard } from '~/components/loadout-card';
import { Button } from '~/components/ui/button';
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

const PAGE_SIZE = 10;
const DEFAULT_MINIMUM_GAMES = 5;

export type SortByOption =
  | 'created_at'
  | 'win_rate'
  | 'kd_ratio'
  | 'matches_played';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const { id: userId, characterId } = params;
  const rawPage = Number(url.searchParams.get('page') || '1');
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const apiPage = page - 1;
  const mode = (url.searchParams.get('mode') ?? 'allGameModes') as GameMode;
  const minParams = url.searchParams.get('minimum');
  const sortParam = (url.searchParams.get('sortBy') ??
    'created_at') as SortByOption;

  let minimumGames = DEFAULT_MINIMUM_GAMES;
  if (minParams !== null && minParams !== '') {
    minimumGames = Number(minParams);
  }

  const { data: loadoutsData, error } = await getSnapshots({
    query: {
      userId,
      characterId,
      count: PAGE_SIZE,
      page: apiPage,
      ...(mode && mode !== 'allGameModes' ? { gameMode: mode } : {}),
      ...(minimumGames > 0 ? { minimumGames } : {}),
      includeStats: true,
      sortBy: sortParam,
    },
  });

  if (error) {
    Logger.error(
      { error, userId, characterId, page },
      'Failed to fetch loadouts in loader',
    );
    return {
      loadouts: {
        items: [],
        count: {},
        stats: {},
      },
      gameMode: mode,
      minimumGames,
      sortBy: sortParam,
      page,
    };
  }

  return {
    loadouts: loadoutsData ?? { items: [], count: {}, stats: {} },
    gameMode: mode,
    minimumGames,
    sortBy: sortParam,
    page,
  };
}

export function Loadouts({ loaderData }: Route.ComponentProps) {
  const {
    loadouts,
    gameMode = 'allGameModes',
    minimumGames = DEFAULT_MINIMUM_GAMES,
    sortBy = 'created_at',
    page = 1,
  } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfileData();

  const rawItems = loadouts?.items ?? [];
  const displayLoadouts =
    sortBy === 'created_at'
      ? [...rawItems].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        })
      : rawItems;

  const hasNextPage = (loadouts?.items?.length ?? 0) === PAGE_SIZE;

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(location.search);
    const isDefaultValue =
      (key === 'mode' && val === 'allGameModes') ||
      (key === 'minimum' && val === DEFAULT_MINIMUM_GAMES.toString()) ||
      (key === 'sortBy' && val === 'created_at');

    if (val !== undefined && val !== '' && !isDefaultValue) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.delete('page');
    const query = params.toString();
    navigate(query ? `?${query}` : location.pathname, { replace: true });
  };

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams(location.search);
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }
    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  const pageTitle = profile?.displayName
    ? `${profile.displayName}'s Loadouts`
    : 'Loadouts';

  return (
    <div className="flex w-full flex-col gap-4">
      <title>{pageTitle}</title>
      <meta property="og:title" content={pageTitle} />
      <meta
        name="description"
        content={`Explore ${profile?.displayName ?? 'Guardian'}'s loadouts with filters for mode and minimum games.`}
      />
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {pageTitle}
          </h2>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <RadioGroup
          value={gameMode}
          onValueChange={(val) => handleFilterChange('mode', val)}
          className="flex flex-col gap-4 md:flex-row md:items-center"
          name="mode"
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
              value={(minimumGames ?? DEFAULT_MINIMUM_GAMES).toString()}
              name="minimum"
              onValueChange={(val) => handleFilterChange('minimum', val)}
            >
              <SelectTrigger className="w-full md:max-w-[200px]">
                <SelectValue placeholder="Minimum Games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Set to 0 to view all loadouts.
            </p>
          </div>
          <div>
            <FormLabel htmlFor="sortBy">Sort By</FormLabel>
            <Select
              value={sortBy}
              name="sortBy"
              onValueChange={(val) => handleFilterChange('sortBy', val)}
            >
              <SelectTrigger className="w-full md:max-w-[200px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest</SelectItem>
                <SelectItem value="win_rate">Win Rate</SelectItem>
                <SelectItem value="kd_ratio">K/D Ratio</SelectItem>
                <SelectItem value="matches_played">Matches Played</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {displayLoadouts.length === 0 && (
        <Empty
          title="Get in the Crucible!"
          description="Play more games so your loadouts will start showing up!"
        />
      )}

      <div className="grid grid-cols-1 gap-4">
        {displayLoadouts.map((snapshot) => (
          <LoadoutCard
            key={snapshot.id}
            snapshot={snapshot}
            stats={loadouts?.stats?.[snapshot.id]}
            gamesCount={loadouts?.count?.[snapshot.id] ?? 0}
            onClick={() => navigate(`${snapshot.id}`)}
          />
        ))}
      </div>

      {(page > 1 || hasNextPage) && (
        <div className="flex w-full flex-row items-center justify-between gap-3 border-t pt-4">
          {page <= 1 ? (
            <Button
              disabled
              variant="outline"
              size="sm"
              className="sm:size-default"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span>Previous</span>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="sm:size-default"
            >
              <Link to={buildPageUrl(page - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                <span>Previous</span>
              </Link>
            </Button>
          )}

          <span className="text-xs font-semibold text-muted-foreground">
            Page {page}
          </span>

          {hasNextPage ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="sm:size-default"
            >
              <Link to={buildPageUrl(page + 1)}>
                <span>Next</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              size="sm"
              className="sm:size-default"
            >
              <span>Next</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default Loadouts;
