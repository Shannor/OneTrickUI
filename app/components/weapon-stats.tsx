import type { GunStat, Stats } from '~/api';
import { Bar } from '~/components/ui/bar';

export interface WeaponStatsProps {
  stats: Stats;
  compact?: boolean;
}

const SPECIAL_STATS: Record<number, string> = {
  3871231066: 'Magazine',
  2715839340: 'Recoil Direction',
  4284893193: 'Rounds Per Minute',
  2961396640: 'Charge Time',
};

const ORDER: Record<number, number> = {
  4284893193: 1, // RPM
  2961396640: 1, // Charge Time
  3614673599: 2, // Blast Radius
  4043523819: 2, // Impact
  1240592695: 3, // Range
  2523465841: 3, // Velocity
  1591432999: 3, // Accuracy
  155624089: 4, // Stability
  943549884: 5, // Handling
  4188031367: 6, // Reload
  1345609583: 7, // AA
  2714457168: 8, // AE
  3555269338: 9, // Zoom
  2715839340: 10, // Recoil
  1931675084: 11, // Ammo Generation
  3481294762: 12, // Heat Generated
  4006394725: 13, // Cooling Efficiency
  3871231066: 14, // Mag
};

enum StatEnum {
  RPM = 4284893193,
  ChargeTime = 2961396640,
  Impact = 4043523819,
  Range = 1240592695,
  Stability = 155624089,
  Handling = 943549884,
  Reload = 4188031367,
  AA = 1345609583,
  AE = 2714457168,
  Zoom = 3555269338,
  Recoil = 2715839340,
  Mag = 3871231066,
  AG = 1931675084,
  BlastRadius = 3614673599,
  GuardResistance = 209426660,
  GuardEndurance = 3736848092,
  SwingSpeed = 2837207746,
  ChargeRate = 3022301683,
  AmmoCapacity = 925767036,
  HeatGenerated = 3481294762,
  CoolingEfficiency = 4006394725,
}

function updateNames(stat: GunStat): string {
  const hashNum = Number(stat.hash);
  switch (hashNum) {
    case StatEnum.RPM:
      return 'RPM';
    case StatEnum.AE:
      return 'A.E.';
    case StatEnum.Reload:
      return 'Reload';
    case StatEnum.AA:
      return 'A.A.';
    case StatEnum.AG:
      return 'A.G.';
    case StatEnum.BlastRadius:
      return 'Blast';
    case StatEnum.GuardResistance:
      return 'Guard Res.';
    case StatEnum.GuardEndurance:
      return 'Guard End.';
    case StatEnum.SwingSpeed:
      return 'Swing';
    case StatEnum.ChargeRate:
      return 'Charge';
    case StatEnum.AmmoCapacity:
      return 'Ammo';
    case StatEnum.HeatGenerated:
      return 'Heat';
    case StatEnum.CoolingEfficiency:
      return 'Cooling';
    default:
      return stat.name;
  }
}

export function WeaponStats({ stats, compact = true }: WeaponStatsProps) {
  const gunStats = Object.values(stats)
    .filter((it) => {
      const hashNum = Number(it.hash);
      return SPECIAL_STATS[hashNum] === undefined && it.value <= 100;
    })
    .sort((a, b) => {
      const orderA = ORDER[Number(a.hash)] ?? 99;
      const orderB = ORDER[Number(b.hash)] ?? 99;
      return orderA - orderB;
    });

  if (gunStats.length === 0) return null;

  if (compact) {
    return (
      <div
        data-testid="weapon-stats-grid"
        className="grid grid-cols-3 gap-1.5 pt-1"
      >
        {gunStats.map((it) => (
          <div
            key={String(it.hash)}
            className="flex min-w-0 items-center justify-between gap-1.5 rounded bg-muted/70 px-2 py-1 text-xs font-medium"
          >
            <span className="truncate text-muted-foreground">
              {updateNames(it)}
            </span>
            <span className="shrink-0 font-bold tabular-nums text-foreground">
              {it.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {gunStats.map((it) => (
        <div
          key={String(it.hash)}
          className="grid grid-cols-12 items-center gap-3 text-sm"
        >
          <div className="col-span-4 font-medium text-muted-foreground sm:col-span-3">
            {updateNames(it)}
          </div>
          <div className="col-span-6 sm:col-span-7">
            <Bar value={Number(it.value)} max={100} />
          </div>
          <div className="col-span-2 font-bold text-foreground">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
