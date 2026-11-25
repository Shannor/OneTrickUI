import { ChevronLeft, ChevronRight, LayersIcon, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { getRequestLogger } from '~/.server/logger';
import { type GameMode, getSnapshots } from '~/api';
import { Empty } from '~/components/empty';
import { GameModeSelector } from '~/components/game-mode-selector';
import { LoadoutCard } from '~/components/loadout-card';
import { Button } from '~/components/ui/button';
import { FormLabel } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { slimSnapshotForCard } from '~/hooks/use-loadout';
import { useNavigationState, useProfileData } from '~/hooks/use-route-loaders';
import { cn, getSiteOrigin } from '~/lib/utils';

import type { Route } from './+types/loadouts';

const PAGE_SIZE = 10;
const DEFAULT_MINIMUM_GAMES = 5;

export type SortByOption =
  'created_at' | 'win_rate' | 'kd_ratio' | 'matches_played';

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const url = new URL(request.url);
  const { id: userId, characterId } = params;
  const rawPage = Number(url.searchParams.get('page') || '1');
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const apiPage = page - 1;
  const mode = (url.searchParams.get('mode') ?? 'allGameModes') as GameMode;
  const minParams = url.searchParams.get('minimum');
  const sortParam = (url.searchParams.get('sortBy') ??
    'created_at') as SortByOption;
  const hasSimilar = url.searchParams.get('hasSimilar') === 'true';

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
      ...(hasSimilar ? { hasSimilar: true } : {}),
      includeStats: true,
      sortBy: sortParam,
    },
  });

  log.set({
    route: 'routes/loadouts',
    loadouts: {
      userId,
      characterId,
      page,
      mode,
      minimumGames,
      sortBy: sortParam,
      hasSimilar,
    },
  });

  if (error) {
    log.error('Failed to fetch loadouts in loader', {
      loadouts: { error, userId, characterId, page },
    });
    return {
      loadouts: {
        items: [],
        count: {},
        stats: {},
        similarCounts: {},
      },
      gameMode: mode,
      minimumGames,
      sortBy: sortParam,
      hasSimilar,
      page,
    };
  }

  return {
    loadouts: loadoutsData
      ? {
          ...loadoutsData,
          items: (loadoutsData.items ?? []).map(slimSnapshotForCard),
        }
      : {
          items: [],
          count: {},
          stats: {},
          similarCounts: {},
        },
    gameMode: mode,
    minimumGames,
    sortBy: sortParam,
    hasSimilar,
    page,
  };
}

export function Loadouts({ loaderData }: Route.ComponentProps) {
  const {
    loadouts,
    gameMode = 'allGameModes',
    minimumGames = DEFAULT_MINIMUM_GAMES,
    sortBy = 'created_at',
    hasSimilar,
    page = 1,
  } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, type } = useProfileData();
  const { isSameRoute: isUpdating } = useNavigationState();
  const isOwner = type === 'owner';

  const isHasSimilarActive =
    hasSimilar ??
    new URLSearchParams(location.search).get('hasSimilar') === 'true';

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
      (key === 'sortBy' && val === 'created_at') ||
      (key === 'hasSimilar' && (val === 'false' || val === ''));

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

  const origin = getSiteOrigin();
  const headingTitle = profile?.displayName
    ? `${profile.displayName}'s Loadouts`
    : 'Loadouts';
  const pageTitle = `${headingTitle} | 1 Trick`;
  const pageDescription = `Explore ${profile?.displayName ?? 'Guardian'}'s loadouts with filters for mode and minimum games on 1 Trick.`;
  const canonicalUrl = `https://d2onetrick.com${location.pathname}`;

  return (
    <div className="flex w-full flex-col gap-4">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${origin}/og-image.png`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${origin}/twitter-image.png`} />
      <link rel="canonical" href={canonicalUrl} />
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {headingTitle}
          </h2>
        </div>
        {isUpdating && (
          <span
            role="status"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Updating…</span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <GameModeSelector
          value={gameMode}
          onValueChange={(val) => handleFilterChange('mode', val)}
          mobileSelectClassName="w-full"
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div>
            <FormLabel htmlFor="minimum">Minimum Games</FormLabel>
            <Select
              value={(minimumGames ?? DEFAULT_MINIMUM_GAMES).toString()}
              name="minimum"
              onValueChange={(val) => handleFilterChange('minimum', val)}
            >
              <SelectTrigger className="h-11 w-full touch-manipulation text-sm md:h-10 md:max-w-[200px]">
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
              <SelectTrigger className="h-11 w-full touch-manipulation text-sm md:h-10 md:max-w-[200px]">
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
          {isOwner && (
            <div className="flex flex-col">
              <span className="mb-2 block text-sm font-medium leading-none">
                Cleanup
              </span>
              <Button
                id="has-similar-filter"
                type="button"
                variant={isHasSimilarActive ? 'default' : 'outline'}
                aria-pressed={isHasSimilarActive}
                onClick={() =>
                  handleFilterChange(
                    'hasSimilar',
                    isHasSimilarActive ? '' : 'true',
                  )
                }
                className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 sm:w-auto md:min-h-10"
              >
                <LayersIcon className="h-4 w-4" />
                <span>Has Similar Loadouts</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {displayLoadouts.length === 0 && (
        <Empty
          title="Get in the Crucible!"
          description="Play more games so your loadouts will start showing up!"
        />
      )}

      <div
        aria-busy={isUpdating}
        className={cn(
          'grid grid-cols-1 gap-4 transition-opacity duration-150',
          isUpdating && 'opacity-60',
        )}
      >
        {displayLoadouts.map((snapshot) => (
          <LoadoutCard
            key={snapshot.id}
            snapshot={snapshot}
            stats={loadouts?.stats?.[snapshot.id]}
            gamesCount={loadouts?.count?.[snapshot.id] ?? 0}
            similarCount={
              isOwner ? (loadouts?.similarCounts?.[snapshot.id] ?? 0) : 0
            }
            onSimilarClick={(snap) => navigate(`${snap.id}/similar`)}
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
              className="min-h-11 px-4 text-sm sm:min-h-10"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span>Previous</span>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-11 touch-manipulation px-4 text-sm sm:min-h-10"
            >
              <Link to={buildPageUrl(page - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                <span>Previous</span>
              </Link>
            </Button>
          )}

          <span className="text-sm font-semibold text-muted-foreground">
            Page {page}
          </span>

          {hasNextPage ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-11 touch-manipulation px-4 text-sm sm:min-h-10"
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
              className="min-h-11 px-4 text-sm sm:min-h-10"
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
