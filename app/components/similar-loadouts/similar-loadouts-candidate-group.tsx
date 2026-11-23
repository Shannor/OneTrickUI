import type React from 'react';
import type {
  ArmorSetBonus,
  ItemSnapshot,
  PlayerStats,
  SimilarSnapshotItem,
} from '~/api';

import { SimilarLoadoutCandidateCard } from './similar-loadouts-candidate-card';

export interface SimilarLoadoutCandidateGroupProps {
  testId: string;
  title: string;
  description: string;
  items: SimilarSnapshotItem[];
  selectedIds: string[];
  isMerging: boolean;
  statsMap: Record<string, PlayerStats>;
  countMap: Record<string, number>;
  targetExoticArmor?: ItemSnapshot;
  targetPowerWeapon?: ItemSnapshot;
  targetClassStatMap: Record<string, number>;
  targetArmorSetBonuses?: ArmorSetBonus[];
  actionButton?: React.ReactNode;
  getLoadoutHref?: (snapshotId: string) => string | undefined;
  onToggleSelect: (id: string) => void;
}

export function SimilarLoadoutCandidateGroup({
  testId,
  title,
  description,
  items,
  selectedIds,
  isMerging,
  statsMap,
  countMap,
  targetExoticArmor,
  targetPowerWeapon,
  targetClassStatMap,
  targetArmorSetBonuses,
  actionButton,
  getLoadoutHref,
  onToggleSelect,
}: SimilarLoadoutCandidateGroupProps) {
  if (items.length === 0) return null;

  return (
    <div data-testid={testId} className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-foreground">
            {title} ({items.length})
          </h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {actionButton}
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <SimilarLoadoutCandidateCard
            key={item.snapshot.id}
            item={item}
            isSelected={selectedIds.includes(item.snapshot.id)}
            isMerging={isMerging}
            statsMap={statsMap}
            countMap={countMap}
            targetExoticArmor={targetExoticArmor}
            targetPowerWeapon={targetPowerWeapon}
            targetClassStatMap={targetClassStatMap}
            targetArmorSetBonuses={targetArmorSetBonuses}
            loadoutHref={getLoadoutHref?.(item.snapshot.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
