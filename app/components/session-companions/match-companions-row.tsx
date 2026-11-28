import { ExternalLink, Users } from 'lucide-react';
import { Link } from 'react-router';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import {
  type MatchCompanion,
  type MatchCompanionWeapon,
  getCompanionSessionPath,
} from '~/lib/session-companions';
import { cn } from '~/lib/utils';

export interface MatchCompanionsRowProps {
  companions: MatchCompanion[];
  className?: string;
}

export function MatchCompanionsRow({
  companions,
  className,
}: MatchCompanionsRowProps) {
  if (companions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-2 border-t border-border/50 pt-3',
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
        Fireteam
      </span>

      <div className="flex flex-col divide-y divide-border/40 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-2 lg:divide-y-0">
        {companions.map((companion) => (
          <MatchCompanionItem
            key={companion.characterId}
            companion={companion}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCompanionItem({ companion }: { companion: MatchCompanion }) {
  const sessionPath = companion.sessionId
    ? getCompanionSessionPath(companion.userId, {
        characterId: companion.characterId,
        sessionId: companion.sessionId,
      })
    : undefined;
  const hasLoadoutIcons =
    Boolean(companion.subclassIcon) || companion.weapons.length > 0;

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2 text-xs first:pt-0 last:pb-0 sm:text-sm lg:justify-start lg:gap-x-2.5 lg:py-0">
      <div className="flex min-w-0 items-center gap-2">
        {companion.emblemUrl && (
          <img
            src={companion.emblemUrl}
            alt={`${companion.displayName} emblem`}
            className="h-5 w-5 shrink-0 rounded-sm object-cover sm:h-6 sm:w-6"
          />
        )}
        <MatchCompanionName
          displayName={companion.displayName}
          characterClass={companion.characterClass}
          sessionPath={sessionPath}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {companion.hasPerformance && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className="inline-flex shrink-0 cursor-pointer touch-manipulation items-baseline gap-1 rounded px-1 py-0.5 tabular-nums transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="font-heading text-sm font-bold text-foreground">
                  {companion.kd.toFixed(2)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  K/D
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {companion.kills}K / {companion.assists}A / {companion.deaths}D
                ({companion.kda.toFixed(2)} Eff)
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {hasLoadoutIcons && (
          <div className="flex shrink-0 items-center gap-1">
            {companion.subclassIcon && (
              <CompanionLoadoutIcon
                icon={companion.subclassIcon}
                label={companion.subclassName ?? 'Subclass'}
                isSubclass
              />
            )}
            {companion.weapons.map((weapon) => (
              <CompanionWeaponIcon key={weapon.itemHash} weapon={weapon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCompanionName({
  displayName,
  characterClass,
  sessionPath,
}: {
  displayName: string;
  characterClass?: string;
  sessionPath?: string;
}) {
  if (sessionPath) {
    return (
      <Link
        to={sessionPath}
        onClick={(event) => event.stopPropagation()}
        aria-label={`View ${displayName}'s session`}
        className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="truncate sm:max-w-[180px]">{displayName}</span>
        {characterClass && (
          <span className="shrink-0 text-xs font-normal text-muted-foreground">
            {characterClass}
          </span>
        )}
        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
      <span className="truncate sm:max-w-[180px]">{displayName}</span>
      {characterClass && (
        <span className="shrink-0 text-xs font-normal text-muted-foreground">
          {characterClass}
        </span>
      )}
    </span>
  );
}

function CompanionWeaponIcon({ weapon }: { weapon: MatchCompanionWeapon }) {
  if (!weapon.icon) {
    return null;
  }

  return (
    <CompanionLoadoutIcon
      icon={weapon.icon}
      label={weapon.name}
      hasYellowBorder={weapon.isEnhanced || weapon.hasActiveCatalyst}
    />
  );
}

function CompanionLoadoutIcon({
  icon,
  label,
  isSubclass = false,
  hasYellowBorder = false,
}: {
  icon: string;
  label: string;
  isSubclass?: boolean;
  hasYellowBorder?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-7 w-7 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <img
            src={icon}
            alt={label}
            className={cn(
              'h-6 w-6 rounded object-cover',
              isSubclass && 'bg-black/60 p-0.5',
              hasYellowBorder &&
                'border border-yellow-500 dark:border-yellow-400',
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
