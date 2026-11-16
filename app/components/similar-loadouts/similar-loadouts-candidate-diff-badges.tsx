import { CheckCircle2, ShieldIcon, SwordsIcon } from 'lucide-react';
import type { ItemSnapshot, SimilarSnapshotItem } from '~/api';
import {
  GearItemDetailsSummary,
  getGearItemName,
} from '~/components/gear-item-pill';
import { Badge } from '~/components/ui/badge';
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

import { extractClassStatMap } from './similar-loadouts-utils';

export interface SimilarLoadoutCandidateDiffBadgesProps {
  item: SimilarSnapshotItem;
  targetExoticArmor?: ItemSnapshot;
  targetPowerWeapon?: ItemSnapshot;
  targetClassStatMap: Record<string, number>;
}

export function SimilarLoadoutCandidateDiffBadges({
  item,
  targetExoticArmor,
  targetPowerWeapon,
  targetClassStatMap,
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
            <Badge
              tabIndex={0}
              variant="secondary"
              className="cursor-help gap-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>
                {bothLackExoticArmor ? 'No Exotic Armor' : 'Exotic Armor Match'}
              </span>
              {isSameExoticDiffInstance && (
                <span className="text-[10px] text-muted-foreground">
                  (Different Roll)
                </span>
              )}
            </Badge>
          ) : (
            <Badge
              tabIndex={0}
              variant="outline"
              className="cursor-help gap-1.5 border-amber-500/50 bg-amber-500/10 text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-amber-400"
            >
              <ShieldIcon className="h-3 w-3" />
              <span>Exotic: {candidateExoticName}</span>
              {isSameExoticNameDiffRoll && (
                <span className="text-[10px] opacity-85">(Different Roll)</span>
              )}
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent className="flex max-w-sm flex-col gap-3 p-3">
          <div className="border-b border-border/60 pb-1.5 text-xs font-semibold">
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

      <Tooltip>
        <TooltipTrigger asChild>
          {item.powerWeaponMatch ? (
            <Badge
              tabIndex={0}
              variant="secondary"
              className="cursor-help gap-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Same Power Weapon</span>
            </Badge>
          ) : (
            <Badge
              tabIndex={0}
              variant="outline"
              className="cursor-help gap-1.5 border-primary/40 bg-primary/10 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SwordsIcon className="h-3 w-3 text-primary" />
              <span>Power: {candidatePowerName}</span>
              {isSamePowerNameDiffRoll && (
                <span className="text-[10px] text-muted-foreground">
                  (Different Roll)
                </span>
              )}
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent className="flex max-w-sm flex-col gap-3 p-3">
          <div className="border-b border-border/60 pb-1.5 text-xs font-semibold">
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
                <Badge
                  tabIndex={0}
                  variant="outline"
                  className={cn(
                    'cursor-help font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    delta > 0
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400',
                  )}
                >
                  {statName} {delta > 0 ? `+${delta}` : delta}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="flex flex-col gap-1 p-2.5 text-xs">
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
        <span className="text-xs text-muted-foreground">No Stat Changes</span>
      )}
    </div>
  );
}
