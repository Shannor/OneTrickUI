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
      className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">Primary Target</Badge>
          <h3 className="text-base font-bold text-foreground sm:text-lg">
            {target.name || 'Loadout'}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{individualStats.matches} Matches</span>
          <span>{individualStats.winPercentage}% Win Rate</span>
          <span>{individualStats.kd.toFixed(2)} K/D</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        <GearItemPill
          label="Subclass"
          item={target.loadout?.[SUBCLASS_BUCKET]}
          tooltipHeading="Primary Subclass"
          className="cursor-help"
        />
        <GearItemPill
          label="Kinetic"
          item={target.loadout?.[KINETIC_BUCKET]}
          tooltipHeading="Primary Kinetic"
          className="cursor-help"
        />
        <GearItemPill
          label="Energy"
          item={target.loadout?.[ENERGY_BUCKET]}
          tooltipHeading="Primary Energy"
          className="cursor-help"
        />
        <GearItemPill
          label="Exotic Armor"
          item={exoticArmor}
          highlight={!!exoticArmor}
          tooltipHeading="Primary Exotic Armor"
          className="cursor-help"
        />
        <GearItemPill
          label="Power Weapon"
          item={target.loadout?.[POWER_BUCKET]}
          tooltipHeading="Primary Power Weapon"
          className="cursor-help"
        />
      </div>

      {armorSetBonuses.length > 0 && (
        <div
          data-testid="primary-armor-set-bonuses"
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Set Bonuses:
          </span>
          {armorSetBonuses.map((bonus) => (
            <ArmorSetBonusPill
              key={String(bonus.setHash)}
              bonus={bonus}
              size="sm"
            />
          ))}
        </div>
      )}

      {classStats.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Class Stats:
          </span>
          {classStats.map((st) => (
            <Badge
              key={st.stat}
              variant="secondary"
              className="font-mono text-xs"
            >
              {st.stat}: {st.value}
            </Badge>
          ))}
        </div>
      )}

      <div
        data-testid="combined-stats-preview"
        className="mt-1 grid grid-cols-3 gap-3 rounded-md border border-border/60 bg-background/80 p-3"
      >
        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Gamepad2Icon className="h-3.5 w-3.5 text-primary" />
            Combined Matches
          </span>
          <span
            data-testid="combined-matches-value"
            className="text-lg font-extrabold text-foreground"
          >
            {combinedStats.matches}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <TrophyIcon className="h-3.5 w-3.5 text-primary" />
            Combined Win Rate
          </span>
          <span
            data-testid="combined-winrate-value"
            className="text-lg font-extrabold text-foreground"
          >
            {combinedStats.winPercentage}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CrosshairIcon className="h-3.5 w-3.5 text-primary" />
            Combined K/D
          </span>
          <span
            data-testid="combined-kd-value"
            className="text-lg font-extrabold text-foreground"
          >
            {combinedStats.kd.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
