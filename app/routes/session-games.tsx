import { ArrowRight, ExternalLink } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { calculateRatio } from '~/calculations/precision';
import { Empty } from '~/components/empty';
import { FormattedDate } from '~/components/formatted-date';
import { HorizontalBanner } from '~/components/horizontal-banner';
import { MatchCompanionsRow } from '~/components/session-companions';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { TooltipProvider } from '~/components/ui/tooltip';
import VerticalBanner from '~/components/vertical-banner';
import { WeaponHeader } from '~/components/weapon-header';
import { getWeapons } from '~/hooks/use-loadout';
import {
  useOptionalProfileData,
  useSessionData,
} from '~/hooks/use-route-loaders';
import {
  TEAMMATE_QUERY_PARAM,
  filterAggregatesByCompanions,
  formatSelectedCompanionNames,
  getMatchCompanions,
  resolveSelectedCompanions,
  resolveSessionCompanions,
} from '~/lib/session-companions';
import { cn } from '~/lib/utils';
import { Performance, type StatItem } from '~/organisims/performance';

import type { Route } from './+types/session-games';

export function SessionGames({ params }: Route.ComponentProps) {
  const { session, aggregates, snapshots, participants, path } =
    useSessionData();
  const { profile } = useOptionalProfileData() ?? {};
  const { characterId, id, sessionId } = params;
  const activeSessionId = sessionId ?? session?.id;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const companions = useMemo(
    () =>
      resolveSessionCompanions(session, aggregates, participants, characterId),
    [session, aggregates, participants, characterId],
  );

  const selectedCompanions = useMemo(
    () => resolveSelectedCompanions(searchParams, companions),
    [searchParams, companions],
  );

  const clearTeammateFilter = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(TEAMMATE_QUERY_PARAM);
    setSearchParams(nextParams, {
      replace: true,
      preventScrollReset: true,
    });
  }, [searchParams, setSearchParams]);

  const sortedFilteredAggregates = useMemo(() => {
    if (!aggregates || aggregates.length === 0) {
      return [];
    }
    const filtered = filterAggregatesByCompanions(
      aggregates,
      characterId,
      selectedCompanions,
      participants,
    );
    return [...filtered].sort(
      (a, b) =>
        new Date(b.activityDetails.period).getTime() -
        new Date(a.activityDetails.period).getTime(),
    );
  }, [aggregates, characterId, selectedCompanions, participants]);

  const sessionName = session?.name || 'Session';
  const displayName = profile?.displayName;
  const sessionNameText = session?.name ? ` ${session.name}` : '';

  const pageTitle = displayName
    ? `${sessionName} - ${displayName} | 1 Trick`
    : `${sessionName} | 1 Trick`;

  const pageDescription =
    session?.description ||
    `Browse games, loadouts, and performance details for ${displayName ?? 'player'}'s session${sessionNameText} on 1 Trick.`;

  const origin = path ? new URL(path).origin : 'https://d2onetrick.com';
  const ogImageUrl = session?.id
    ? `${origin}/og/session/${session.id}.png`
    : `${origin}/og-image.png`;

  const metaTags = (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {path && <meta property="og:url" content={path} />}
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImageUrl} />
      {path && <link rel="canonical" href={path} />}
    </>
  );

  const totalRecordedGames = session?.aggregateIds?.length ?? 0;

  if (!aggregates || aggregates?.length === 0) {
    if (totalRecordedGames > 0) {
      return (
        <>
          {metaTags}
          <Empty
            title="Processing Match Data"
            description="Your game was recorded! Stats and match details are currently processing."
          />
        </>
      );
    }
    return (
      <>
        {metaTags}
        <Empty
          title="Get in the Crucible!"
          description="Play some games so we can get new information!"
        />
      </>
    );
  }

  if (!snapshots) {
    return (
      <>
        {metaTags}
        <Empty
          title="Get in the Crucible!"
          description="Play some games so we can get new information!"
        />
      </>
    );
  }

  const selectedNamesLabel = formatSelectedCompanionNames(selectedCompanions);
  const emptyFilterDescription =
    selectedCompanions.length > 1
      ? 'No matches in this session included all selected teammates. Clear the filter to view all matches.'
      : 'Clear the teammate filter to view all matches in this session.';

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-8 md:gap-6">
        {metaTags}

        {sortedFilteredAggregates.length === 0 &&
        selectedCompanions.length > 0 ? (
          <div className="flex flex-col items-center gap-3">
            <Empty
              title={`No Matches Found with ${selectedNamesLabel}`}
              description={emptyFilterDescription}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearTeammateFilter}
            >
              Show All Matches
            </Button>
          </div>
        ) : (
          sortedFilteredAggregates.map((value, index, arr) => {
            const {
              activityDetails,
              snapshotLinks,
              performance: performances,
            } = value;

            const link = snapshotLinks[characterId];
            const performance = performances[characterId];
            const snapshot = link?.snapshotId
              ? snapshots[link.snapshotId]
              : undefined;

            let hasLoadout = false;
            switch (link?.confidenceLevel) {
              case 'high':
                hasLoadout = true;
                break;
              case 'medium':
                hasLoadout = true;
                break;
              case 'low':
                hasLoadout = true;
                break;
            }

            const previous = index > 0 ? arr[index - 1] : undefined;
            const showLoadout =
              !previous ||
              previous.snapshotLinks[characterId]?.snapshotId !==
                link?.snapshotId;
            const won = performance?.playerStats?.standing?.value === 0;

            const stats: StatItem[] = [];
            const kdStats: StatItem[] = [];
            if (performance) {
              const kills = performance.playerStats.kills?.value ?? 0;
              const assists = performance.playerStats.assists?.value ?? 0;
              const deaths = performance.playerStats.deaths?.value ?? 0;
              const kd = calculateRatio(kills, deaths);
              const kda = calculateRatio(kills + assists, deaths);
              stats.push(
                { label: 'Kills', value: kills.toString() },
                { label: 'Assists', value: assists.toString() },
                { label: 'Deaths', value: deaths.toString() },
              );
              kdStats.push(
                { label: 'K/D', value: kd.toFixed(2) },
                { label: 'Efficiency', value: kda.toFixed(2) },
              );
            }

            const matchCompanions = getMatchCompanions(
              value,
              characterId,
              session?.userId ?? id,
              participants,
              snapshots,
            );

            return (
              <div key={value.id} className={cn('flex flex-col gap-4')}>
                {!hasLoadout && (
                  <div
                    className={cn(
                      'flex flex-row items-center gap-4 py-2 text-sm text-muted-foreground',
                    )}
                  >
                    No Found Loadout for Games
                  </div>
                )}
                {snapshot && showLoadout && (
                  <div className={cn('flex flex-col gap-3 pb-2 pt-4')}>
                    <Link
                      to={`/profile/${id}/c/${characterId}/loadouts/${snapshot.id}`}
                      className="group inline-flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-2 text-base font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0 sm:w-fit sm:justify-start sm:rounded-md sm:px-2.5 sm:py-1 sm:text-sm"
                    >
                      <span className="truncate group-hover:underline">
                        {snapshot?.name ?? 'Snapshot'}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:h-3.5 sm:w-3.5" />
                    </Link>
                    <div
                      className={cn('flex flex-row flex-wrap gap-3', {
                        hidden: !hasLoadout,
                      })}
                    >
                      {getWeapons(snapshot.loadout).map((weapon) => (
                        <WeaponHeader
                          key={weapon.itemHash}
                          properties={weapon.details}
                          onlyIcon
                        />
                      ))}
                    </div>
                  </div>
                )}
                <Card
                  className="group w-full min-w-0 cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg"
                  onClick={() => {
                    const activityPath = activeSessionId
                      ? `/profile/${id}/c/${characterId}/sessions/${activeSessionId}/activities/${activityDetails.instanceId}`
                      : `/profile/${id}/c/${characterId}/activities/${activityDetails.instanceId}`;
                    navigate(activityPath);
                  }}
                >
                  <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-5 md:p-6">
                    <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:gap-6">
                      <div className="hidden flex-row gap-2 md:flex">
                        {won ? (
                          <VerticalBanner
                            label="Victory"
                            className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                          />
                        ) : (
                          <VerticalBanner
                            label="Defeat"
                            className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100"
                          />
                        )}
                        <img
                          src={activityDetails.imageUrl}
                          className="hidden h-auto w-36 rounded-lg object-cover md:block md:w-28 lg:w-36 xl:w-44"
                          alt="activity image"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="flex flex-col gap-4 md:hidden">
                          {won ? (
                            <HorizontalBanner
                              label="Victory"
                              className="h-5 bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                            />
                          ) : (
                            <HorizontalBanner
                              label="Defeat"
                              className="h-5 bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100"
                            />
                          )}
                          <img
                            src={activityDetails.imageUrl}
                            className="h-28 w-full rounded-lg object-cover md:hidden"
                            alt="activity image"
                          />
                        </div>
                        <div className="flex flex-row items-center gap-3">
                          <img
                            src={activityDetails.activityIcon}
                            className="h-12 w-12 shrink-0 rounded-lg bg-black/50 object-cover"
                            alt="activity image"
                          />
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <Description
                              activity={activityDetails.activity}
                              mode={activityDetails.mode}
                            />
                            <h3 className="truncate font-heading text-lg font-bold tracking-wide text-foreground transition-colors group-hover:text-primary sm:text-xl lg:text-2xl">
                              {activityDetails.location}
                            </h3>

                            <FormattedDate
                              date={activityDetails.period}
                              formatStr="p"
                              fallbackFormatStr="HH:mm"
                              className="text-xs text-muted-foreground"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-border/60">
                          <Performance stats={stats} className="md:pr-4" />
                          <Performance stats={kdStats} className="md:pl-4" />
                        </div>
                      </div>
                    </div>

                    <MatchCompanionsRow companions={matchCompanions} />

                    <div className="flex w-full items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-11 w-full touch-manipulation justify-between gap-1.5 px-2 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary md:min-h-9 md:w-auto md:justify-end lg:text-sm"
                      >
                        <span>View Game Details</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1 lg:h-4 lg:w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </TooltipProvider>
  );
}

function Description({ activity, mode }: { activity: string; mode?: string }) {
  const ironBanner = 'iron banner';
  if (activity.toLowerCase().includes(ironBanner)) {
    return (
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {activity}
      </div>
    );
  }
  const control = 'control';
  const trials = 'trials of osiris';
  const competitive = 'competitive';

  let label = activity;
  let modeLabel = mode;
  if (activity.toLowerCase().includes(control)) {
    label = 'Quickplay';
    if (mode) {
      modeLabel = mode.replace('Quickplay', '');
    }
  } else if (activity.toLowerCase().includes(competitive)) {
    label = 'Competitive';
    if (mode) {
      modeLabel = mode.replace('Competitive', '').replace('Quickplay', '');
    }
  } else if (activity.toLowerCase().includes(trials)) {
    label = 'Trials of Osiris';
    if (mode) {
      modeLabel = mode.replace('Trials of Osiris', '');
    }
  }
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
      {modeLabel && <span>{' - ' + modeLabel}</span>}
    </div>
  );
}

export default SessionGames;
