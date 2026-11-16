import { AlertCircle } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFetcher, useNavigate } from 'react-router';
import {
  type CharacterSnapshot,
  type GetSimilarSnapshotsResponse,
  type PlayerStats,
  type SimilarSnapshotItem,
  getSimilarSnapshots,
} from '~/api';
import { calculateCombinedStats } from '~/calculations/precision';
import { LoadingButton } from '~/components/loading-button';
import { Button } from '~/components/ui/button';
import { toast } from '~/components/ui/sonner';
import { TooltipProvider } from '~/components/ui/tooltip';
import {
  POWER_BUCKET,
  getExotic,
  useClassStats,
} from '~/hooks/use-loadout';
import { cn } from '~/lib/utils';

import {
  SimilarLoadoutsLegend,
  SimilarLoadoutsLoadingState,
  SimilarLoadoutsMergeBanner,
  SimilarLoadoutsPageHeader,
} from './similar-loadouts-banners';
import { SimilarLoadoutCandidateGroup } from './similar-loadouts-candidate-group';
import { SimilarLoadoutsPrimaryHeader } from './similar-loadouts-primary-header';
import {
  extractClassStatMap,
  recomputeSimilarItems,
} from './similar-loadouts-utils';

export interface SimilarLoadoutsViewProps {
  snapshotId: string | null;
  /**
   * Optional pre-loaded data from a route loader (e.g. routes/loadout-similar.tsx).
   * When provided, skips the client-side fetch waterfall on initial render.
   */
  initialData?: GetSimilarSnapshotsResponse | null;
  /**
   * Optional error message from a route loader.
   */
  initialError?: string | null;
  /**
   * Whether the view is currently active/visible (e.g. `true` on a dedicated tab/page,
   * or `isOpen` when rendered inside a modal dialog).
   */
  isActive?: boolean;
  /**
   * Optional callback invoked when the user cancels or when a merge finishes.
   */
  onClose?: () => void;
  /**
   * Optional callback invoked whenever the merge submission state changes.
   */
  onMergingChange?: (isMerging: boolean) => void;
  /**
   * Whether to render the standalone page header (Title + Global Scope notice).
   * Defaults to `false` when rendered inside a Dialog that provides its own `<DialogHeader>`,
   * and `true` when used as a standalone tab/route view.
   */
  showPageHeader?: boolean;
  userId?: string;
  characterId?: string;
  /**
   * Set to true when opened from /profile/:id/c/:characterId/loadouts/:snapshotId
   * so that if the user swaps primary and merges, we navigate to the new primary snapshot route.
   */
  isDetailPage?: boolean;
}

function buildDiffsMap(
  data: GetSimilarSnapshotsResponse,
): Record<string, Record<string, number>> {
  const diffsMap: Record<string, Record<string, number>> = {
    [data.target.id]: {},
  };
  for (const item of data.items) {
    diffsMap[item.snapshot.id] = item.statDiffs ?? {};
  }
  return diffsMap;
}

export function SimilarLoadoutsView({
  snapshotId,
  initialData,
  initialError,
  isActive = true,
  onClose,
  onMergingChange,
  showPageHeader = false,
  userId,
  characterId,
  isDetailPage = false,
}: SimilarLoadoutsViewProps) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(
    initialError ?? null,
  );

  const [activeTarget, setActiveTarget] = useState<CharacterSnapshot | null>(
    initialData?.target ?? null,
  );
  const [items, setItems] = useState<SimilarSnapshotItem[]>(
    initialData?.items ?? [],
  );
  const [allSnapshots, setAllSnapshots] = useState<CharacterSnapshot[]>(
    initialData
      ? [initialData.target, ...initialData.items.map((i) => i.snapshot)]
      : [],
  );
  const [initialDiffsById, setInitialDiffsById] = useState<
    Record<string, Record<string, number>>
  >(initialData ? buildDiffsMap(initialData) : {});
  const [statsMap, setStatsMap] = useState<Record<string, PlayerStats>>(
    initialData?.stats ?? {},
  );
  const [countMap, setCountMap] = useState<Record<string, number>>(
    initialData?.count ?? {},
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isMerging = fetcher.state !== 'idle';

  useEffect(() => {
    onMergingChange?.(isMerging);
  }, [isMerging, onMergingChange]);

  useEffect(() => {
    if (initialData !== undefined) {
      if (initialData) {
        setActiveTarget(initialData.target);
        setItems(initialData.items);
        setAllSnapshots([
          initialData.target,
          ...initialData.items.map((i) => i.snapshot),
        ]);
        setInitialDiffsById(buildDiffsMap(initialData));
        setStatsMap(initialData.stats ?? {});
        setCountMap(initialData.count ?? {});
        setFetchError(null);
      } else if (initialError) {
        setFetchError(initialError);
      }
      setSelectedIds([]);
      setIsLoading(false);
      return;
    }

    if (!isActive || !snapshotId) {
      setSelectedIds([]);
      setFetchError(null);
      setHasSubmitted(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setFetchError(null);
    setSelectedIds([]);
    setHasSubmitted(false);

    fetch(
      `/action/similar-snapshots?snapshotId=${encodeURIComponent(snapshotId)}`,
    )
      .then(async (resp) => {
        if (!resp.ok) {
          throw new Error('Fallback to direct client call');
        }
        const json = (await resp.json()) as GetSimilarSnapshotsResponse;
        return { data: json, error: undefined };
      })
      .catch(() =>
        getSimilarSnapshots({
          path: { snapshotId },
          query: { includeStats: true },
        }),
      )
      .then((res) => {
        if (cancelled) return;
        if (res.error || !res.data) {
          setFetchError(
            (res.error as { message?: string })?.message ||
              'Failed to load similar loadouts',
          );
          setIsLoading(false);
          return;
        }

        const data = res.data;
        const pool = [data.target, ...data.items.map((i) => i.snapshot)];

        setActiveTarget(data.target);
        setItems(data.items);
        setAllSnapshots(pool);
        setInitialDiffsById(buildDiffsMap(data));
        setStatsMap(data.stats ?? {});
        setCountMap(data.count ?? {});
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFetchError('Failed to load similar loadouts');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isActive, snapshotId, initialData, initialError]);

  useEffect(() => {
    if (!hasSubmitted || fetcher.state !== 'idle' || !fetcher.data) {
      return;
    }

    if (fetcher.data.ok && activeTarget) {
      setHasSubmitted(false);
      setSelectedIds([]);
      toast.success('Loadouts merged successfully');
      onClose?.();

      if (
        isDetailPage &&
        snapshotId &&
        activeTarget.id !== snapshotId &&
        userId &&
        characterId
      ) {
        navigate(
          `/profile/${userId}/c/${characterId}/loadouts/${activeTarget.id}`,
        );
      }
    }
  }, [
    hasSubmitted,
    fetcher.state,
    fetcher.data,
    activeTarget,
    isDetailPage,
    snapshotId,
    userId,
    characterId,
    navigate,
    onClose,
  ]);

  const highSimilarityItems = useMemo(
    () => items.filter((item) => item.tier === 'high'),
    [items],
  );
  const baseSimilarityItems = useMemo(
    () => items.filter((item) => item.tier === 'base'),
    [items],
  );

  const targetClassStats = useClassStats(activeTarget ?? undefined);
  const targetClassStatMap = useMemo(
    () => extractClassStatMap(activeTarget ?? undefined),
    [activeTarget],
  );
  const targetExoticArmor = useMemo(
    () => getExotic(activeTarget?.loadout).armor,
    [activeTarget],
  );
  const targetPowerWeapon = useMemo(
    () => activeTarget?.loadout?.[POWER_BUCKET],
    [activeTarget],
  );

  const targetIndividualStats = useMemo(() => {
    if (!activeTarget) {
      return { matches: 0, winRateRatio: 0, winPercentage: 0, kd: 0 };
    }
    return calculateCombinedStats(activeTarget.id, [], statsMap, countMap);
  }, [activeTarget, statsMap, countMap]);

  const combinedStats = useMemo(() => {
    if (!activeTarget) {
      return { matches: 0, winRateRatio: 0, winPercentage: 0, kd: 0 };
    }
    return calculateCombinedStats(
      activeTarget.id,
      selectedIds,
      statsMap,
      countMap,
    );
  }, [activeTarget, selectedIds, statsMap, countMap]);

  const handleToggleCandidate = (id: string) => {
    if (isMerging) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllHigh = () => {
    if (isMerging) return;
    const highIds = highSimilarityItems.map((i) => i.snapshot.id);
    const allHighSelected =
      highIds.length > 0 && highIds.every((id) => selectedIds.includes(id));

    if (allHighSelected) {
      setSelectedIds((prev) => prev.filter((id) => !highIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...highIds])));
    }
  };

  const handleSwapPrimary = (newPrimarySnapshot: CharacterSnapshot) => {
    if (isMerging || !activeTarget || newPrimarySnapshot.id === activeTarget.id)
      return;

    const recomputed = recomputeSimilarItems(
      newPrimarySnapshot,
      allSnapshots,
      initialDiffsById,
    );

    setActiveTarget(newPrimarySnapshot);
    setItems(recomputed);
    setSelectedIds((prev) =>
      prev.filter((id) => id !== newPrimarySnapshot.id),
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isMerging || !activeTarget || selectedIds.length === 0) return;

    const formData = new FormData();
    formData.append('baseLoadoutId', activeTarget.id);
    for (const sourceId of selectedIds) {
      formData.append('sourceSnapshotIds', sourceId);
    }
    setHasSubmitted(true);
    fetcher.submit(formData, {
      method: 'post',
      action: '/action/merge-loadout',
    });
  };

  const actionError =
    hasSubmitted && fetcher.state === 'idle' && fetcher.data?.ok === false
      ? fetcher.data.error
      : undefined;

  const mergeStatusText =
    fetcher.state === 'loading'
      ? 'Refreshing updated loadout stats...'
      : `Merging ${selectedIds.length} ${selectedIds.length === 1 ? 'loadout' : 'loadouts'} and reassigning match history across all sessions...`;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col gap-4">
        {showPageHeader && <SimilarLoadoutsPageHeader />}

        {isLoading && <SimilarLoadoutsLoadingState />}

        {fetchError && !isLoading && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {!isLoading && !fetchError && activeTarget && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isMerging && (
              <SimilarLoadoutsMergeBanner statusText={mergeStatusText} />
            )}

            <SimilarLoadoutsPrimaryHeader
              target={activeTarget}
              individualStats={targetIndividualStats}
              combinedStats={combinedStats}
              exoticArmor={targetExoticArmor}
              classStats={targetClassStats}
            />

            {items.length > 0 && <SimilarLoadoutsLegend />}

            <div
              className={cn(
                'flex flex-col gap-4 transition-opacity',
                isMerging && 'pointer-events-none opacity-60',
              )}
            >
              <SimilarLoadoutCandidateGroup
                testId="high-similarity-group"
                title="High Similarity"
                description="Same Kinetic, Energy, Subclass, and Exotic Armor"
                items={highSimilarityItems}
                selectedIds={selectedIds}
                isMerging={isMerging}
                statsMap={statsMap}
                countMap={countMap}
                targetExoticArmor={targetExoticArmor}
                targetPowerWeapon={targetPowerWeapon}
                targetClassStatMap={targetClassStatMap}
                actionButton={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isMerging}
                    onClick={handleSelectAllHigh}
                    className="h-7 text-xs"
                  >
                    Select All High Similarity
                  </Button>
                }
                onToggleSelect={handleToggleCandidate}
                onSwapPrimary={handleSwapPrimary}
              />

              <SimilarLoadoutCandidateGroup
                testId="base-similarity-group"
                title="Base Similarity"
                description="Same Kinetic, Energy, and Subclass with different Exotic Armor"
                items={baseSimilarityItems}
                selectedIds={selectedIds}
                isMerging={isMerging}
                statsMap={statsMap}
                countMap={countMap}
                targetExoticArmor={targetExoticArmor}
                targetPowerWeapon={targetPowerWeapon}
                targetClassStatMap={targetClassStatMap}
                onToggleSelect={handleToggleCandidate}
                onSwapPrimary={handleSwapPrimary}
              />

              {items.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No similar loadouts found to merge.
                </p>
              )}
            </div>

            {actionError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex flex-row items-center justify-between gap-3 border-t pt-4 sm:justify-end">
              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isMerging}
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}
              <LoadingButton
                type="submit"
                disabled={selectedIds.length === 0 || isMerging}
                isLoading={isMerging}
                loadingText={
                  fetcher.state === 'loading'
                    ? 'Refreshing...'
                    : `Merging (${selectedIds.length})...`
                }
              >
                Merge Selected ({selectedIds.length})
              </LoadingButton>
            </div>
          </form>
        )}
      </div>
    </TooltipProvider>
  );
}
