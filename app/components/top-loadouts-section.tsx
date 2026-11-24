import { AlertCircleIcon, SwordsIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Await, Link } from 'react-router';
import type { GetBestPerformingLoadoutsResponse } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutCard } from '~/components/loadout-card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

export interface TopLoadoutsResult {
  data: GetBestPerformingLoadoutsResponse;
  error?: string;
}

export const EMPTY_TOP_LOADOUTS: GetBestPerformingLoadoutsResponse = {
  items: [],
  count: {},
  stats: {},
};

export function LoadoutCardSkeleton() {
  return (
    <Card
      aria-hidden="true"
      className="flex h-full w-full min-w-0 flex-col overflow-hidden border"
    >
      <CardContent className="flex h-full w-full min-w-0 flex-1 flex-col justify-between gap-3.5 p-4 sm:p-5">
        <div className="flex w-full min-w-0 flex-col gap-3.5">
          <div className="flex w-full min-w-0 flex-col gap-2.5 border-b border-border/50 pb-3">
            <div className="flex w-full items-center justify-between gap-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-20 shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex min-w-0 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-7 w-14" />
              </div>
            ))}
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 border-t border-border/50 pt-3">
            <Skeleton className="h-3.5 w-24" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end border-t border-border/40 pt-3">
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TopLoadoutsSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading top loadouts"
      data-testid="top-loadouts-skeleton"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <LoadoutCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function TopLoadoutsErrorState({
  hasSessions = false,
  browseAllTo,
  isOwner = false,
}: {
  hasSessions?: boolean;
  browseAllTo?: string;
  isOwner?: boolean;
}) {
  return (
    <Empty
      icon={
        <AlertCircleIcon className="h-12 w-12 self-center text-muted-foreground/60" />
      }
      title="Unable to Load Top Loadouts"
      description="We couldn't load top performing loadouts right now. Please try again later."
    >
      {hasSessions && browseAllTo && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant={isOwner ? 'outline' : 'default'}>
            <Link to={browseAllTo}>Browse All Loadouts</Link>
          </Button>
        </div>
      )}
    </Empty>
  );
}

function TopLoadoutsHeader({
  viewAllTo,
  showViewAll = false,
}: {
  viewAllTo: string;
  showViewAll?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Top Loadouts
        </h3>
        <Badge
          variant="secondary"
          className="text-xs font-medium uppercase tracking-wider"
        >
          All Modes · Min. 10 Games
        </Badge>
      </div>
      {showViewAll && (
        <Link
          to={viewAllTo}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all loadouts
        </Link>
      )}
    </div>
  );
}

function TopLoadoutsContent({
  result,
  isOwner,
  hasSessions,
  browseAllTo,
  onSelectLoadout,
}: {
  result?: TopLoadoutsResult;
  isOwner: boolean;
  hasSessions: boolean;
  browseAllTo: string;
  onSelectLoadout: (snapshotId: string) => void;
}) {
  if (result?.error) {
    return (
      <TopLoadoutsErrorState
        hasSessions={hasSessions}
        browseAllTo={browseAllTo}
        isOwner={isOwner}
      />
    );
  }

  const topLoadouts = result?.data?.items ?? [];
  const statsRecord = (result?.data?.stats ?? {}) as Record<
    string,
    Record<string, { value?: number }>
  >;
  const countRecord = (result?.data?.count ?? {}) as Record<string, number>;

  if (topLoadouts.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {topLoadouts.map((snapshot) => (
          <LoadoutCard
            key={snapshot.id}
            snapshot={snapshot}
            stats={statsRecord[snapshot.id]}
            gamesCount={countRecord[snapshot.id] ?? 0}
            compact
            onClick={() => onSelectLoadout(snapshot.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <Empty
      icon={
        <SwordsIcon className="h-12 w-12 self-center text-muted-foreground/60" />
      }
      title={isOwner ? 'Get in the Crucible!' : 'No Top Loadouts Yet'}
      description={
        isOwner
          ? 'Play at least 10 games with a loadout so your top builds will start showing up!'
          : 'This Guardian has not recorded 10 or more games with a single loadout on this character yet.'
      }
    >
      {hasSessions && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant={isOwner ? 'outline' : 'default'}>
            <Link to={browseAllTo}>Browse All Loadouts</Link>
          </Button>
        </div>
      )}
    </Empty>
  );
}

export interface TopLoadoutsSectionProps {
  loadouts: TopLoadoutsResult | Promise<TopLoadoutsResult>;
  isOwner: boolean;
  hasSessions: boolean;
  userId?: string;
  characterId?: string;
  onSelectLoadout: (snapshotId: string) => void;
}

export function TopLoadoutsSection({
  loadouts,
  isOwner,
  hasSessions,
  userId,
  characterId,
  onSelectLoadout,
}: TopLoadoutsSectionProps) {
  const viewAllTo =
    userId && characterId
      ? `/profile/${userId}/c/${characterId}/loadouts`
      : 'loadouts';
  const browseAllTo =
    userId && characterId
      ? `/profile/${userId}/c/${characterId}/loadouts?minimum=1`
      : 'loadouts?minimum=1';

  return (
    <section className="flex flex-col gap-4">
      <Suspense
        fallback={
          <>
            <TopLoadoutsHeader viewAllTo={viewAllTo} />
            <TopLoadoutsSkeletonGrid />
          </>
        }
      >
        <Await
          resolve={loadouts}
          errorElement={
            <>
              <TopLoadoutsHeader viewAllTo={viewAllTo} />
              <TopLoadoutsErrorState
                hasSessions={hasSessions}
                browseAllTo={browseAllTo}
                isOwner={isOwner}
              />
            </>
          }
        >
          {(resolved) => {
            const topLoadouts = resolved?.data?.items ?? [];
            const hasLoadouts = !resolved?.error && topLoadouts.length > 0;

            return (
              <>
                <TopLoadoutsHeader
                  viewAllTo={viewAllTo}
                  showViewAll={hasLoadouts}
                />
                <TopLoadoutsContent
                  result={resolved}
                  isOwner={isOwner}
                  hasSessions={hasSessions}
                  browseAllTo={browseAllTo}
                  onSelectLoadout={onSelectLoadout}
                />
              </>
            );
          }}
        </Await>
      </Suspense>
    </section>
  );
}
