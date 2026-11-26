import { CheckCircle2, ShieldCheckIcon } from 'lucide-react';
import type { ArmorSetBonus } from '~/api';
import {
  ArmorSetBonusTooltipDetails,
  formatArmorSetBonusSummary,
} from '~/components/armor-set-bonuses';
import { badgeVariants } from '~/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { useTapTooltip } from '~/hooks/use-tap-tooltip';
import { cn } from '~/lib/utils';

export interface ArmorSetBonusDiffHeadingParams {
  armorSetBonusMatch: boolean;
  candidateBonuses?: ArmorSetBonus[];
  targetBonuses?: ArmorSetBonus[];
}

export function getArmorSetBonusDiffHeading({
  armorSetBonusMatch,
  candidateBonuses = [],
  targetBonuses = [],
}: ArmorSetBonusDiffHeadingParams): string {
  const candidateSummary = formatArmorSetBonusSummary(candidateBonuses);
  const targetSummary = formatArmorSetBonusSummary(targetBonuses);

  if (candidateBonuses.length === 0 && targetBonuses.length === 0) {
    return 'Neither loadout has active Armor Set Bonuses';
  }
  if (armorSetBonusMatch) {
    return `Same Armor Set Bonuses as Primary (${candidateSummary})`;
  }
  if (candidateBonuses.length === 0) {
    return `No active Armor Set Bonuses (Primary has ${targetSummary})`;
  }
  if (targetBonuses.length === 0) {
    return 'Active Armor Set Bonuses (Primary has none)';
  }
  return `Different Armor Set Bonuses than Primary (${targetSummary})`;
}

export interface ArmorSetBonusDiffBadgeProps {
  armorSetBonusMatch: boolean;
  candidateBonuses?: ArmorSetBonus[];
  targetBonuses?: ArmorSetBonus[];
}

export function ArmorSetBonusDiffBadge({
  armorSetBonusMatch,
  candidateBonuses = [],
  targetBonuses = [],
}: ArmorSetBonusDiffBadgeProps) {
  const { open, onOpenChange, triggerProps, contentProps } = useTapTooltip();
  const bothLackSetBonuses =
    candidateBonuses.length === 0 && targetBonuses.length === 0;
  const candidateSummary = formatArmorSetBonusSummary(candidateBonuses);
  const tooltipHeading = getArmorSetBonusDiffHeading({
    armorSetBonusMatch,
    candidateBonuses,
    targetBonuses,
  });

  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-testid="armor-set-bonus-diff-badge"
          {...triggerProps}
          className={cn(
            badgeVariants({
              variant: armorSetBonusMatch ? 'secondary' : 'outline',
            }),
            'min-h-9 cursor-pointer touch-manipulation px-3 py-1.5 text-xs sm:min-h-0 sm:px-2.5 sm:py-0.5',
            armorSetBonusMatch
              ? 'gap-1.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-1'
              : 'gap-1.5 border-sky-500/50 bg-sky-500/10 text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-sky-400',
          )}
        >
          {armorSetBonusMatch ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 sm:h-3 sm:w-3" />
              <span>
                {bothLackSetBonuses ? 'No Set Bonuses' : 'Set Bonus Match'}
              </span>
            </>
          ) : (
            <>
              <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0 sm:h-3 sm:w-3" />
              <span>Set: {candidateSummary}</span>
            </>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        {...contentProps}
        className="flex max-w-sm flex-col gap-3 p-3"
      >
        <div className="border-b border-border/60 pb-1.5 text-xs font-semibold sm:text-sm">
          {tooltipHeading}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <ArmorSetBonusTooltipDetails
            bonuses={candidateBonuses}
            heading="This Loadout's Set Bonuses"
          />
          {!armorSetBonusMatch && (
            <div className="border-t border-border/50 pt-2">
              <ArmorSetBonusTooltipDetails
                bonuses={targetBonuses}
                heading="Primary Target's Set Bonuses"
              />
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
