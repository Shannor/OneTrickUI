import { ChevronDown, Hourglass, SquareLibrary } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import type {
  CharacterSnapshot,
  InstancePerformance,
  User,
  WeaponInstanceMetrics,
} from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { ClassStats } from '~/charts/ClassStats';
import { ArmorSet } from '~/components/armor-set';
import { Label } from '~/components/label';
import {
  Abilities,
  Aspects,
  Fragments,
  SubClassHeader,
} from '~/components/sub-class';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { Weapon } from '~/components/weapon';
import { cn } from '~/lib/utils';
import { Performance, type StatItem } from '~/organisims/performance';
import { SubClassProvider } from '~/providers/sub-class-provider';

export interface PlayerCardProps {
  user?: User;
  performance: InstancePerformance;
  snapshot?: CharacterSnapshot;
  characterId?: string;
  sessionId?: string;
  snapshotId?: string;
  showWeaponTitles?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const BUCKET_ORDER: Record<number, number> = {
  1498876634: 1, // Kinetic / Primary
  2465295065: 2, // Energy / Secondary
  953998645: 3, // Power / Heavy
  953926928: 3, // Power alternative
};

function getWeaponKillsCount(w: WeaponInstanceMetrics): number {
  const killsStat = w.stats?.uniqueWeaponKills;
  return Number(killsStat?.basic?.value ?? 0);
}

function getWeaponSlotOrder(w: WeaponInstanceMetrics): number {
  const bucketHash = Number(w.properties?.baseInfo?.bucketHash ?? 0);
  return BUCKET_ORDER[bucketHash] ?? 99;
}

export function PlayerCard({
  user,
  performance,
  snapshot,
  characterId,
  sessionId,
  snapshotId,
  showWeaponTitles = true,
  collapsible = false,
  defaultOpen = false,
}: PlayerCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showClassDetails, setShowClassDetails] = useState(false);

  const weapons = Object.values(performance.weapons ?? {})
    .filter((it) => !!it?.properties?.baseInfo?.name)
    .sort((a, b) => {
      const slotA = getWeaponSlotOrder(a);
      const slotB = getWeaponSlotOrder(b);
      if (slotA !== slotB) {
        return slotA - slotB;
      }
      return getWeaponKillsCount(b) - getWeaponKillsCount(a);
    });

  const kills = performance.playerStats.kills?.value ?? 0;
  const assists = performance.playerStats.assists?.value ?? 0;
  const deaths = performance.playerStats.deaths?.value ?? 0;
  const kd = calculateRatio(kills, deaths);
  const kda = calculateRatio(kills + assists, deaths);

  const stats: StatItem[] = [
    { label: 'Kills', value: kills.toString() },
    { label: 'Assists', value: assists.toString() },
    { label: 'Deaths', value: deaths.toString() },
    { label: 'K/D', value: kd.toFixed(2) },
    { label: 'Efficiency', value: kda.toFixed(2) },
  ];

  const values = Object.values(snapshot?.stats ?? {})
    .map((stat) => ({
      stat: stat.name,
      value: stat.value,
    }))
    .filter((it) => it.stat !== 'Power');

  const charId = characterId || snapshot?.characterId;
  const targetUserId = user?.id || snapshot?.userId;

  const cardHeaderContent = (
    <div className="col-span-12 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-0.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Player
        </Label>
        <h4 className="text-xl font-bold tracking-tight">
          {targetUserId ? (
            <Link
              to={`/profile/${targetUserId}`}
              className="transition-colors hover:text-primary"
              viewTransition
            >
              {user?.displayName ?? 'Unknown Player'}
            </Link>
          ) : (
            <span>{user?.displayName ?? 'Unknown Player'}</span>
          )}
        </h4>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {targetUserId && charId && sessionId && (
          <Button asChild variant="outline" size="sm">
            <Link
              to={`/profile/${targetUserId}/c/${charId}/sessions/${sessionId}`}
            >
              <Hourglass className="mr-1.5 h-3.5 w-3.5 text-primary" />
              View Session
            </Link>
          </Button>
        )}
        {targetUserId && charId && snapshotId && (
          <Button asChild variant="outline" size="sm">
            <Link
              to={`/profile/${targetUserId}/c/${charId}/loadouts/${snapshotId}`}
            >
              <SquareLibrary className="mr-1.5 h-3.5 w-3.5 text-primary" />
              View Loadout
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  const detailedContent = (
    <>
      {/* Subclass Super Header (Above Weapons) */}
      {snapshot && (
        <div className="col-span-12">
          <SubClassProvider snapshot={snapshot}>
            <SubClassHeader
              showMore={showClassDetails}
              onToggleShowMore={() => setShowClassDetails((prev) => !prev)}
            />

            {showClassDetails && (
              <div className="mt-3 flex flex-col gap-4 border-t pt-3">
                <Abilities />
                <Aspects />
                <Fragments />
              </div>
            )}
          </SubClassProvider>
        </div>
      )}

      {/* Weapons Grid */}
      {weapons.length > 0 && (
        <div className="col-span-12 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-10 xl:grid-cols-3 xl:gap-12">
            {weapons.map((w) => (
              <Weapon
                key={String(w.referenceId)}
                {...w}
                showTitle={showWeaponTitles}
              />
            ))}
          </div>
        </div>
      )}

      {/* Armor & Class Stats (Below Weapons) */}
      {snapshot && (
        <div className="col-span-12 grid grid-cols-1 gap-6 border-t pt-4 md:grid-cols-2">
          <ArmorSet snapshot={snapshot} />
          <ClassStats data={values} />
        </div>
      )}
    </>
  );

  const mainCard = (
    <Card>
      <CardContent className="grid grid-cols-12 gap-6 p-4 md:p-6">
        {cardHeaderContent}

        {/* Stats */}
        <div className="col-span-12 flex flex-row items-start justify-between gap-4">
          <Performance stats={stats} />
        </div>

        {collapsible ? (
          <>
            <CollapsibleContent className="col-span-12 grid grid-cols-12 gap-6 pt-2 transition-all">
              {detailedContent}
            </CollapsibleContent>

            {/* Bottom Expand / Collapse Bar */}
            <div className="col-span-12 border-t pt-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  aria-label="Toggle loadout details"
                >
                  <span>
                    {isOpen ? 'Hide Loadout Details' : 'Expand Loadout Details'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </>
        ) : (
          detailedContent
        )}
      </CardContent>
    </Card>
  );

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {mainCard}
      </Collapsible>
    );
  }

  return mainCard;
}
