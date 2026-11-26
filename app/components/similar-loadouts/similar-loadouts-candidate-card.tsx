import { ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import type {
  ArmorSetBonus,
  ItemSnapshot,
  PlayerStats,
  SimilarSnapshotItem,
} from '~/api';
import { calculateCombinedStats } from '~/calculations/precision';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

import { SimilarLoadoutCandidateDiffBadges } from './similar-loadouts-candidate-diff-badges';

export interface SimilarLoadoutCandidateCardProps {
  item: SimilarSnapshotItem;
  isSelected: boolean;
  isMerging: boolean;
  statsMap: Record<string, PlayerStats>;
  countMap: Record<string, number>;
  targetExoticArmor?: ItemSnapshot;
  targetPowerWeapon?: ItemSnapshot;
  targetClassStatMap: Record<string, number>;
  targetArmorSetBonuses?: ArmorSetBonus[];
  loadoutHref?: string;
  onToggleSelect: (id: string) => void;
}

export function SimilarLoadoutCandidateCard({
  item,
  isSelected,
  isMerging,
  statsMap,
  countMap,
  targetExoticArmor,
  targetPowerWeapon,
  targetClassStatMap,
  targetArmorSetBonuses,
  loadoutHref,
  onToggleSelect,
}: SimilarLoadoutCandidateCardProps) {
  const { snapshot } = item;
  const candidateStats = useMemo(
    () => calculateCombinedStats(snapshot.id, [], statsMap, countMap),
    [snapshot.id, statsMap, countMap],
  );

  return (
    <div
      data-testid={`similar-candidate-${snapshot.id}`}
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3.5 transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border/70 bg-card hover:border-border',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <label
          className={cn(
            'flex min-h-11 min-w-0 flex-1 touch-manipulation items-center gap-3 py-1',
            isMerging ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <input
            type="checkbox"
            checked={isSelected}
            disabled={isMerging}
            onChange={() => onToggleSelect(snapshot.id)}
            aria-label={`Select ${snapshot.name || 'Loadout'}`}
            className="h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-heading text-xl font-bold tracking-wide text-foreground sm:text-2xl">
              {snapshot.name || 'Loadout'}
            </span>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
              <span>{candidateStats.matches} Matches</span>
              <span>{candidateStats.winPercentage}% Win Rate</span>
              <span>{candidateStats.kd.toFixed(2)} K/D</span>
            </div>
          </div>
        </label>

        {loadoutHref && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              'min-h-10 touch-manipulation gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground sm:min-h-9 sm:text-sm',
              isMerging && 'pointer-events-none opacity-50',
            )}
          >
            <Link
              to={loadoutHref}
              aria-disabled={isMerging}
              tabIndex={isMerging ? -1 : undefined}
            >
              <span>View Loadout</span>
              <ArrowUpRight className="!h-4 !w-4" />
            </Link>
          </Button>
        )}
      </div>

      <SimilarLoadoutCandidateDiffBadges
        item={item}
        targetExoticArmor={targetExoticArmor}
        targetPowerWeapon={targetPowerWeapon}
        targetClassStatMap={targetClassStatMap}
        targetArmorSetBonuses={targetArmorSetBonuses}
      />
    </div>
  );
}
