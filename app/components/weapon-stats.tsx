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
  155624089: 4, // Stability
  943549884: 5, // Handling
  4188031367: 6, // Reload
  1345609583: 7, // AA
  2714457168: 8, // AE
  3555269338: 9, // Zoom
  2715839340: 10, // Recoil
  1931675084: 11, // Ammo Generation
  3871231066: 12, // Mag
};

enum StatEnum {
  RPM = 4284893193, // Rounds Per Minute
  ChargeTime = 2961396640, // Charge Time
  Impact = 4043523819, // Impact
  Range = 1240592695, // Range
  Stability = 155624089, // Stability
  Handling = 943549884, // Handling
  Reload = 4188031367, // Reload
  AA = 1345609583, // Aim Assistance
  AE = 2714457168, // Airborne Effectiveness
  Zoom = 3555269338, // Zoom
  Recoil = 2715839340, // Recoil Direction
  Mag = 3871231066, // Magazine
  AG = 1931675084, // Ammo Generation
  BlastRadius = 3614673599, // Blast Radius
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
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {gunStats.map((it) => (
          <div
            key={String(it.hash)}
            className="flex items-center gap-1 rounded bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium"
          >
            <span className="text-muted-foreground">{updateNames(it)}</span>
            <span className="font-bold text-foreground">{it.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {gunStats.map((it) => (
        <div
          key={String(it.hash)}
          className="grid grid-cols-12 items-center gap-4 text-xs"
        >
          <div className="col-span-3 font-medium text-muted-foreground">
            {updateNames(it)}
          </div>
          <div className="col-span-7">
            <Bar value={Number(it.value)} max={100} />
          </div>
          <div className="col-span-2 font-bold text-foreground">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
