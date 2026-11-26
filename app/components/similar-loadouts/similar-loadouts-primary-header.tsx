import { CrosshairIcon, Gamepad2Icon, TrophyIcon } from 'lucide-react';
import type { CharacterSnapshot, ItemSnapshot } from '~/api';
import type { CombinedStatsResult } from '~/calculations/precision';
import { ArmorSetBonusPill } from '~/components/armor-set-bonuses';
import { GearItemPill } from '~/components/gear-item-pill';
import { Badge } from '~/components/ui/badge';
import {
  ENERGY_BUCKET,
  KINETIC_BUCKET,
  POWER_BUCKET,
  SUBCLASS_BUCKET,
} from '~/hooks/use-loadout';

export interface SimilarLoadoutsPrimaryHeaderProps {
  target: CharacterSnapshot;
  individualStats: CombinedStatsResult;
  combinedStats: CombinedStatsResult;
  exoticArmor?: ItemSnapshot;
  classStats: { stat: string; value: number }[];
}

export function SimilarLoadoutsPrimaryHeader({
  target,
  individualStats,
  combinedStats,
  exoticArmor,
  classStats,
}: SimilarLoadoutsPrimaryHeaderProps) {
  const armorSetBonuses = target.armorSetBonuses ?? [];

  return (
    <div
      data-testid="primary-loadout-header"
      className="flex flex-col gap-3.5 rounded-lg border border-primary/40 bg-primary/5 p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
          <Badge variant="default" className="w-fit shrink-0 whitespace-nowrap">
            Primary Target
          </Badge>
          <h3 className="w-full break-words text-2xl font-bold tracking-wide text-foreground sm:w-auto">
            {target.name || 'Loadout'}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
          <span>{individualStats.matches} Matches</span>
          <span>{individualStats.winPercentage}% Win Rate</span>
          <span>{individualStats.kd.toFixed(2)} K/D</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        <GearItemPill
          label="Subclass"
          item={target.loadout?.[SUBCLASS_BUCKET]}
          tooltipHeading="Primary Subclass"
        />
        <GearItemPill
          label="Kinetic"
          item={target.loadout?.[KINETIC_BUCKET]}
          tooltipHeading="Primary Kinetic"
        />
        <GearItemPill
          label="Energy"
          item={target.loadout?.[ENERGY_BUCKET]}
          tooltipHeading="Primary Energy"
        />
        <GearItemPill
          label="Exotic Armor"
          item={exoticArmor}
          highlight={!!exoticArmor}
          tooltipHeading="Primary Exotic Armor"
        />
        <GearItemPill
          label="Power Weapon"
          item={target.loadout?.[POWER_BUCKET]}
          tooltipHeading="Primary Power Weapon"
        />
      </div>

      {armorSetBonuses.length > 0 && (
        <div
          data-testid="primary-armor-set-bonuses"
          className="flex flex-col items-start gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            Set Bonuses:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {armorSetBonuses.map((bonus) => (
              <ArmorSetBonusPill
                key={String(bonus.setHash)}
                bonus={bonus}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {classStats.length > 0 && (
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            Class Stats:
          </span>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            {classStats.map((st) => (
              <Badge
                key={st.stat}
                variant="secondary"
                className="w-full justify-center px-2.5 py-1 font-mono text-xs sm:w-auto sm:py-0.5"
              >
                {st.stat}: {st.value}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div
        data-testid="combined-stats-preview"
        className="mt-1 grid grid-cols-1 gap-3 rounded-md border border-border/60 bg-background/80 p-3 sm:grid-cols-3"
      >
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Gamepad2Icon className="h-4 w-4 text-primary" />
            Combined Matches
          </span>
          <span
            data-testid="combined-matches-value"
            className="text-xl font-extrabold text-foreground sm:text-2xl"
          >
            {combinedStats.matches}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrophyIcon className="h-4 w-4 text-primary" />
            Combined Win Rate
          </span>
          <span
            data-testid="combined-winrate-value"
            className="text-xl font-extrabold text-foreground sm:text-2xl"
          >
            {combinedStats.winPercentage}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CrosshairIcon className="h-4 w-4 text-primary" />
            Combined K/D
          </span>
          <span
            data-testid="combined-kd-value"
            className="text-xl font-extrabold text-foreground sm:text-2xl"
          >
            {combinedStats.kd.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
