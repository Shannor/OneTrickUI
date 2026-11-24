import { AlertCircle } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher, useNavigate } from 'react-router';
import type {
  GetSimilarSnapshotsResponse,
  PlayerStats,
  SimilarSnapshotItem,
} from '~/api';
import { calculateCombinedStats } from '~/calculations/precision';
import { LoadingButton } from '~/components/loading-button';
import { Button } from '~/components/ui/button';
import { toast } from '~/components/ui/sonner';
import { TooltipProvider } from '~/components/ui/tooltip';
import { POWER_BUCKET, getExotic, useClassStats } from '~/hooks/use-loadout';
import { cn } from '~/lib/utils';

import {
  SimilarLoadoutsLegend,
  SimilarLoadoutsMergeBanner,
  SimilarLoadoutsPageHeader,
} from './similar-loadouts-banners';
import { SimilarLoadoutCandidateGroup } from './similar-loadouts-candidate-group';
import { SimilarLoadoutsPrimaryHeader } from './similar-loadouts-primary-header';
import { extractClassStatMap } from './similar-loadouts-utils';

export interface SimilarLoadoutsViewProps {
  /**
   * Pre-loaded similar snapshots payload from `routes/loadout-similar.tsx`.
   */
  initialData?: GetSimilarSnapshotsResponse | null;
  /**
   * Optional error message from the route loader.
   */
  initialError?: string | null;
  /**
   * Whether to render the standalone page header (Title + Global Scope notice).
   */
  showPageHeader?: boolean;
  userId?: string;
  characterId?: string;
}

const EMPTY_ITEMS: SimilarSnapshotItem[] = [];
const EMPTY_STATS: Record<string, PlayerStats> = {};
const EMPTY_COUNTS: Record<string, number> = {};
const EMPTY_SELECTED_IDS: string[] = [];

export function SimilarLoadoutsView({
  initialData,
  initialError,
  showPageHeader = true,
  userId,
  characterId,
}: SimilarLoadoutsViewProps) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const navigate = useNavigate();

  const target = initialData?.target ?? null;
  const items = initialData?.items ?? EMPTY_ITEMS;
  const statsMap = initialData?.stats ?? EMPTY_STATS;
  const countMap = initialData?.count ?? EMPTY_COUNTS;

  const [selection, setSelection] = useState<{
    source: GetSimilarSnapshotsResponse | null | undefined;
    acknowledgedMergeData: { ok: boolean; error?: string } | undefined;
    ids: string[];
  }>({
    source: initialData,
    acknowledgedMergeData: undefined,
    ids: [],
  });
  const previousState = useRef(fetcher.state);
  const mergeContextRef = useRef<{
    mergedAll: boolean;
    redirectPath: string | null;
  }>({ mergedAll: false, redirectPath: null });

  const isMerging = fetcher.state !== 'idle';

  const isStaleSelection =
    selection.source !== initialData ||
    (fetcher.state === 'idle' &&
      fetcher.data?.ok === true &&
      selection.acknowledgedMergeData !== fetcher.data);

  const selectedIds = isStaleSelection ? EMPTY_SELECTED_IDS : selection.ids;

  useEffect(() => {
    if (
      previousState.current !== 'idle' &&
      fetcher.state === 'idle' &&
      fetcher.data?.ok
    ) {
      toast.success('Loadouts merged successfully');
      const { mergedAll, redirectPath } = mergeContextRef.current;
      if (mergedAll && redirectPath) {
        navigate(redirectPath);
      }
    }
    previousState.current = fetcher.state;
  }, [fetcher.state, fetcher.data, navigate]);

  const getLoadoutHref = useCallback(
    (candidateSnapshotId: string) => {
      if (!userId || !characterId) return undefined;
      return `/profile/${userId}/c/${characterId}/loadouts/${candidateSnapshotId}`;
    },
    [userId, characterId],
  );

  const highSimilarityItems = useMemo(
    () => items.filter((item) => item.tier === 'high'),
    [items],
  );
  const baseSimilarityItems = useMemo(
    () => items.filter((item) => item.tier === 'base'),
    [items],
  );

  const allHighSelected = useMemo(() => {
    if (highSimilarityItems.length === 0) return false;
    return highSimilarityItems.every((item) =>
      selectedIds.includes(item.snapshot.id),
    );
  }, [highSimilarityItems, selectedIds]);

  const targetClassStats = useClassStats(target ?? undefined);
  const targetClassStatMap = useMemo(
    () => extractClassStatMap(target ?? undefined),
    [target],
  );
  const targetExoticArmor = useMemo(
    () => getExotic(target?.loadout).armor,
    [target],
  );
  const targetPowerWeapon = useMemo(
    () => target?.loadout?.[POWER_BUCKET],
    [target],
  );

  const targetIndividualStats = useMemo(() => {
    if (!target) {
      return { matches: 0, winRateRatio: 0, winPercentage: 0, kd: 0 };
    }
    return calculateCombinedStats(target.id, [], statsMap, countMap);
  }, [target, statsMap, countMap]);

  const combinedStats = useMemo(() => {
    if (!target) {
      return { matches: 0, winRateRatio: 0, winPercentage: 0, kd: 0 };
    }
    return calculateCombinedStats(target.id, selectedIds, statsMap, countMap);
  }, [target, selectedIds, statsMap, countMap]);

  const updateSelectedIds = (updater: (prev: string[]) => string[]) => {
    setSelection({
      source: initialData,
      acknowledgedMergeData: fetcher.data,
      ids: updater(selectedIds),
    });
  };

  const handleToggleCandidate = (id: string) => {
    if (isMerging) return;
    updateSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllHigh = () => {
    if (isMerging) return;
    const highIds = highSimilarityItems.map((i) => i.snapshot.id);

    if (allHighSelected) {
      updateSelectedIds((prev) => prev.filter((id) => !highIds.includes(id)));
    } else {
      updateSelectedIds((prev) => Array.from(new Set([...prev, ...highIds])));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isMerging || !target || selectedIds.length === 0) return;

    const formData = new FormData();
    formData.append('baseLoadoutId', target.id);
    for (const sourceId of selectedIds) {
      formData.append('sourceSnapshotIds', sourceId);
    }
    mergeContextRef.current = {
      mergedAll: items.length > 0 && selectedIds.length >= items.length,
      redirectPath:
        userId && characterId
          ? `/profile/${userId}/c/${characterId}/loadouts/${target.id}`
          : null,
    };
    fetcher.submit(formData, {
      method: 'post',
      action: '/action/merge-loadout',
    });
  };

  const actionError =
    fetcher.state === 'idle' && fetcher.data?.ok === false
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

        {initialError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{initialError}</span>
          </div>
        )}

        {!initialError && target && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isMerging && (
              <SimilarLoadoutsMergeBanner statusText={mergeStatusText} />
            )}

            <SimilarLoadoutsPrimaryHeader
              target={target}
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
                targetArmorSetBonuses={target.armorSetBonuses}
                actionButton={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isMerging}
                    onClick={handleSelectAllHigh}
                    className="h-7 text-xs"
                  >
                    {allHighSelected
                      ? 'Deselect All High Similarity'
                      : 'Select All High Similarity'}
                  </Button>
                }
                getLoadoutHref={getLoadoutHref}
                onToggleSelect={handleToggleCandidate}
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
                targetArmorSetBonuses={target.armorSetBonuses}
                getLoadoutHref={getLoadoutHref}
                onToggleSelect={handleToggleCandidate}
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

            <div className="flex flex-row items-center justify-end gap-3 border-t pt-4">
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
