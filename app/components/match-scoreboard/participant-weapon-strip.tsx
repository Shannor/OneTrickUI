import type { WeaponInstanceMetrics } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import {
  getWeaponDisplayName,
  getWeaponKillsCount,
} from '~/lib/match-scoreboard';
import { getItemIconUrl } from '~/lib/utils';

export interface ParticipantWeaponStripProps {
  weapons: WeaponInstanceMetrics[];
}

function getWeaponArchetype(weapon: WeaponInstanceMetrics): string | undefined {
  return (
    weapon.properties?.baseInfo?.itemTypeDisplayName ??
    weapon.itemTypeDisplayName
  );
}

export function ParticipantWeaponStrip({
  weapons,
}: ParticipantWeaponStripProps) {
  if (weapons.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      aria-label="Match weapon kills"
    >
      {weapons.map((weapon, index) => {
        const name = getWeaponDisplayName(weapon);
        const iconUrl = getItemIconUrl(weapon.properties, weapon.display?.icon);
        const kills = getWeaponKillsCount(weapon);
        const precisionKills =
          weapon.stats?.uniqueWeaponPrecisionKills?.basic?.displayValue;
        const precisionRatio =
          weapon.stats?.uniqueWeaponKillsPrecisionKills?.basic?.displayValue;
        const archetype = getWeaponArchetype(weapon);
        const key = weapon.referenceId
          ? String(weapon.referenceId)
          : `${name}-${index}`;

        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${name}: ${kills} kills`}
                className="inline-flex min-h-7 cursor-pointer touch-manipulation items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Avatar className="h-5 w-5 shrink-0 rounded-sm bg-black/50">
                  <AvatarImage src={iconUrl} alt={name} />
                  <AvatarFallback className="rounded-sm text-[10px] font-bold">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{kills}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="flex flex-col gap-0.5 text-xs"
            >
              <span className="font-semibold text-foreground">{name}</span>
              {archetype && (
                <span className="text-muted-foreground">{archetype}</span>
              )}
              <span className="text-muted-foreground">
                {kills} {kills === 1 ? 'kill' : 'kills'}
                {precisionKills ? ` · ${precisionKills} precision` : ''}
                {precisionRatio ? ` (${precisionRatio})` : ''}
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
