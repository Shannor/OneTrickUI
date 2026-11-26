import { CheckCircle2, ShieldIcon, SwordsIcon } from 'lucide-react';
import type { ArmorSetBonus, ItemSnapshot, SimilarSnapshotItem } from '~/api';
import {
  GearItemDetailsSummary,
  getGearItemName,
} from '~/components/gear-item-pill';
import { badgeVariants } from '~/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import {
  POWER_BUCKET,
  effectiveInstanceId,
  getExotic,
} from '~/hooks/use-loadout';
import { cn } from '~/lib/utils';

import { ArmorSetBonusDiffBadge } from './armor-set-bonus-diff-badge';
import { extractClassStatMap } from './similar-loadouts-utils';

export interface SimilarLoadoutCandidateDiffBadgesProps {
  item: SimilarSnapshotItem;
  targetExoticArmor?: ItemSnapshot;
  targetPowerWeapon?: ItemSnapshot;
  targetClassStatMap: Record<string, number>;
  targetArmorSetBonuses?: ArmorSetBonus[];
}

export function SimilarLoadoutCandidateDiffBadges({
  item,
  targetExoticArmor,
  targetPowerWeapon,
  targetClassStatMap,
  targetArmorSetBonuses,
}: SimilarLoadoutCandidateDiffBadgesProps) {
  const { snapshot } = item;
  const candidateExotic = getExotic(snapshot.loadout).armor;
  const candidateExoticName = candidateExotic
    ? getGearItemName(candidateExotic)
    : 'No Exotic Armor';
  const targetExoticName = targetExoticArmor
    ? getGearItemName(targetExoticArmor)
    : 'No Exotic Armor';

  const bothLackExoticArmor = !candidateExotic && !targetExoticArmor;
  const isSameExoticNameDiffRoll =
    !item.exoticArmorMatch &&
    !!candidateExotic &&
    !!targetExoticArmor &&
    candidateExoticName === targetExoticName;
  const isSameExoticDiffInstance =
    item.exoticArmorMatch &&
    !!candidateExotic &&
    !!targetExoticArmor &&
    effectiveInstanceId(candidateExotic) !==
      effectiveInstanceId(targetExoticArmor);

  const candidatePower = snapshot.loadout?.[POWER_BUCKET];
  const candidatePowerName = getGearItemName(candidatePower);
  const targetPowerName = getGearItemName(targetPowerWeapon);
  const isSamePowerNameDiffRoll =
    !item.powerWeaponMatch &&
    !!candidatePower &&
    !!targetPowerWeapon &&
    candidatePowerName === targetPowerName;

  const candClassStatMap = extractClassStatMap(snapshot);
  const statDiffEntries = Object.entries(item.statDiffs ?? {}).filter(
    ([key, val]) => key !== 'Power' && val !== 0,
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2.5 text-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          {item.exoticArmorMatch ? (
            <button
              type="button"
              className={cn(
                badgeVariants({ variant: 'secondary' }),
                'min-h-7 cursor-pointer touch-manipulation gap-1.5 px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0 sm:gap-1 sm:py-0.5',
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 sm:h-3 sm:w-3" />
              <span>
                {bothLackExoticArmor ? 'No Exotic Armor' : 'Exotic Armor Match'}
              </span>
              {isSameExoticDiffInstance && (
                <span className="text-xs text-muted-foreground sm:text-[10px]">
                  (Different Roll)
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                badgeVariants({ variant: 'outline' }),
                'min-h-7 cursor-pointer touch-manipulation gap-1.5 border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-amber-400 sm:min-h-0 sm:py-0.5',
              )}
            >
              <ShieldIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              <span>Exotic: {candidateExoticName}</span>
              {isSameExoticNameDiffRoll && (
                <span className="text-xs opacity-85 sm:text-[10px]">
                  (Different Roll)
                </span>
              )}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent className="flex w-[calc(100vw-2rem)] flex-col gap-3 p-3 sm:w-auto sm:max-w-sm">
          <div className="border-b border-border/60 pb-1.5 text-xs font-semibold sm:text-sm">
            {bothLackExoticArmor
              ? 'Neither loadout has Exotic Armor equipped'
              : item.exoticArmorMatch
                ? isSameExoticDiffInstance
                  ? `Same Exotic Armor (${candidateExoticName}), different armor roll`
                  : `Same Exotic Armor as Primary (${candidateExoticName})`
                : isSameExoticNameDiffRoll
                  ? `Different version / stat roll of ${candidateExoticName}`
                  : `Different Exotic Armor than Primary (${targetExoticName})`}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <GearItemDetailsSummary
              item={candidateExotic}
              heading="This Loadout's Exotic Armor"
            />
            {(!item.exoticArmorMatch || isSameExoticDiffInstance) && (
              <div className="border-t border-border/50 pt-2">
                <GearItemDetailsSummary
                  item={targetExoticArmor}
                  heading="Primary Target's Exotic Armor"
                />
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      <ArmorSetBonusDiffBadge
        armorSetBonusMatch={item.armorSetBonusMatch}
        candidateBonuses={snapshot.armorSetBonuses}
        targetBonuses={targetArmorSetBonuses}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          {item.powerWeaponMatch ? (
            <button
              type="button"
              className={cn(
                badgeVariants({ variant: 'secondary' }),
                'min-h-7 cursor-pointer touch-manipulation gap-1.5 px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0 sm:gap-1 sm:py-0.5',
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 sm:h-3 sm:w-3" />
              <span>Same Power Weapon</span>
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                badgeVariants({ variant: 'outline' }),
                'min-h-7 cursor-pointer touch-manipulation gap-1.5 border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0 sm:py-0.5',
              )}
            >
              <SwordsIcon className="h-3.5 w-3.5 text-primary sm:h-3 sm:w-3" />
              <span>Power: {candidatePowerName}</span>
              {isSamePowerNameDiffRoll && (
                <span className="text-xs text-muted-foreground sm:text-[10px]">
                  (Different Roll)
                </span>
              )}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent className="flex w-[calc(100vw-2rem)] flex-col gap-3 p-3 sm:w-auto sm:max-w-sm">
          <div className="border-b border-border/60 pb-1.5 text-xs font-semibold sm:text-sm">
            {item.powerWeaponMatch
              ? `Same Power Weapon as Primary (${candidatePowerName})`
              : isSamePowerNameDiffRoll
                ? `Different roll of ${candidatePowerName}`
                : `Different Power Weapon than Primary (${targetPowerName})`}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <GearItemDetailsSummary
              item={candidatePower}
              heading="This Loadout's Power Weapon"
            />
            {!item.powerWeaponMatch && (
              <div className="border-t border-border/50 pt-2">
                <GearItemDetailsSummary
                  item={targetPowerWeapon}
                  heading="Primary Target's Power Weapon"
                />
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {statDiffEntries.length > 0 ? (
        statDiffEntries.map(([statName, delta]) => {
          const targetVal = targetClassStatMap[statName];
          const candVal =
            candClassStatMap[statName] ??
            (targetVal !== undefined ? targetVal + delta : undefined);

          return (
            <Tooltip key={statName}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    badgeVariants({ variant: 'outline' }),
                    'min-h-7 cursor-pointer touch-manipulation px-2.5 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0 sm:py-0.5',
                    delta > 0
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400',
                  )}
                >
                  {statName} {delta > 0 ? `+${delta}` : delta}
                </button>
              </TooltipTrigger>
              <TooltipContent className="flex flex-col gap-1 p-3 text-xs sm:text-sm">
                <span className="font-bold">
                  {statName} Class Stat Difference
                </span>
                {targetVal !== undefined && candVal !== undefined && (
                  <div className="flex items-center justify-between gap-4 text-muted-foreground">
                    <span>Primary: {targetVal}</span>
                    <span>This Loadout: {candVal}</span>
                  </div>
                )}
                <span
                  className={cn(
                    'font-semibold',
                    delta > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  {delta > 0
                    ? `+${delta} higher than Primary Target`
                    : `${delta} lower than Primary Target`}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })
      ) : (
        <span className="text-xs text-muted-foreground sm:text-sm">
          No Stat Changes
        </span>
      )}
    </div>
  );
}
