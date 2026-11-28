import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Empty } from '~/components/empty';
import {
  EmptyFilteredMatches,
  MatchCompanionsRow,
} from '~/components/session-companions';
import {
  SessionMatchCard,
  SessionMatchLoadoutHeader,
  hasMatchLoadoutConfidence,
} from '~/components/session-match-card';
import { TooltipProvider } from '~/components/ui/tooltip';
import {
  useOptionalProfileData,
  useSessionData,
} from '~/hooks/use-route-loaders';
import { useSessionCompanionFilter } from '~/hooks/use-session-companion-filter';
import { getMatchCompanions } from '~/lib/session-companions';

import type { Route } from './+types/session-games';

export function SessionGames({ params }: Route.ComponentProps) {
  const { session, aggregates, snapshots, participants, path } =
    useSessionData();
  const { profile } = useOptionalProfileData() ?? {};
  const { characterId, id, sessionId } = params;
  const activeSessionId = sessionId ?? session?.id;
  const navigate = useNavigate();

  const { selectedCompanions, filteredAggregates, clearFilters } =
    useSessionCompanionFilter({
      session,
      aggregates,
      participants,
      characterId,
    });

  const sortedFilteredAggregates = useMemo(() => {
    if (filteredAggregates.length === 0) {
      return [];
    }
    return [...filteredAggregates].sort(
      (a, b) =>
        new Date(b.activityDetails.period).getTime() -
        new Date(a.activityDetails.period).getTime(),
    );
  }, [filteredAggregates]);

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

  if (!aggregates || aggregates.length === 0) {
    const gamesRecorded = session?.aggregateIds?.length ?? 0;
    if (gamesRecorded > 0) {
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

  const hasTeammateFilter = selectedCompanions.length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {metaTags}

        {hasTeammateFilter && sortedFilteredAggregates.length === 0 ? (
          <EmptyFilteredMatches
            selectedCompanions={selectedCompanions}
            onClearFilters={clearFilters}
            context="games"
          />
        ) : (
          sortedFilteredAggregates.map((aggregate, index, arr) => {
            const { activityDetails, snapshotLinks } = aggregate;
            const link = snapshotLinks[characterId];
            const snapshot = link?.snapshotId
              ? snapshots[link.snapshotId]
              : undefined;
            const hasLoadout = hasMatchLoadoutConfidence(link?.confidenceLevel);
            const previous = index > 0 ? arr[index - 1] : undefined;
            const showLoadout =
              !previous ||
              previous.snapshotLinks[characterId]?.snapshotId !==
                link?.snapshotId;

            const matchCompanions = getMatchCompanions(
              aggregate,
              characterId,
              session?.userId ?? id,
              participants,
              snapshots,
            );

            const activityPath = activeSessionId
              ? `/profile/${id}/c/${characterId}/sessions/${activeSessionId}/activities/${activityDetails.instanceId}`
              : `/profile/${id}/c/${characterId}/activities/${activityDetails.instanceId}`;

            return (
              <div key={aggregate.id} className="flex flex-col gap-4">
                {!hasLoadout && (
                  <div className="flex flex-row items-center gap-4 py-2 text-sm text-muted-foreground">
                    No Found Loadout for Games
                  </div>
                )}
                {snapshot && showLoadout && (
                  <SessionMatchLoadoutHeader
                    snapshot={snapshot}
                    loadoutPath={`/profile/${id}/c/${characterId}/loadouts/${snapshot.id}`}
                    showWeapons={hasLoadout}
                  />
                )}
                <SessionMatchCard
                  aggregate={aggregate}
                  characterId={characterId}
                  onSelect={() => navigate(activityPath)}
                >
                  <MatchCompanionsRow companions={matchCompanions} />
                </SessionMatchCard>
              </div>
            );
          })
        )}
      </div>
    </TooltipProvider>
  );
}

export default SessionGames;
