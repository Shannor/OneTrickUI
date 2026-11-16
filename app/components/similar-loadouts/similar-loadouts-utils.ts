import type { CharacterSnapshot, SimilarSnapshotItem } from '~/api';
import {
  POWER_BUCKET,
  effectiveInstanceId,
  getExotic,
} from '~/hooks/use-loadout';

export function extractClassStatMap(
  snapshot?: CharacterSnapshot,
): Record<string, number> {
  const map: Record<string, number> = {};
  if (!snapshot?.stats) return map;
  for (const stat of Object.values(snapshot.stats)) {
    if (stat?.name && stat.name !== 'Power') {
      map[stat.name] = stat.value ?? 0;
    }
  }
  return map;
}

export function doesExoticArmorMatch(
  target?: CharacterSnapshot,
  candidate?: CharacterSnapshot,
): boolean {
  const targetExoticHash = String(
    getExotic(target?.loadout).armor?.itemHash ?? 0,
  );
  const candExoticHash = String(
    getExotic(candidate?.loadout).armor?.itemHash ?? 0,
  );
  return targetExoticHash === candExoticHash;
}

export function doesPowerWeaponMatch(
  target?: CharacterSnapshot,
  candidate?: CharacterSnapshot,
): boolean {
  const targetPower = target?.loadout?.[POWER_BUCKET];
  const candPower = candidate?.loadout?.[POWER_BUCKET];

  const targetPowerHash = String(targetPower?.itemHash ?? 0);
  const candPowerHash = String(candPower?.itemHash ?? 0);
  if (targetPowerHash !== candPowerHash) return false;

  const targetInstanceId = effectiveInstanceId(targetPower);
  const candInstanceId = effectiveInstanceId(candPower);
  return (
    targetInstanceId === candInstanceId ||
    (!targetInstanceId && !candInstanceId)
  );
}

export function computeStatDiffMap(
  baseMap: Record<string, number>,
  candidateMap: Record<string, number>,
): Record<string, number> {
  const diffs: Record<string, number> = {};
  const allStatKeys = new Set([
    ...Object.keys(baseMap),
    ...Object.keys(candidateMap),
  ]);

  for (const key of allStatKeys) {
    if (key === 'Power') continue;
    const delta = (candidateMap[key] ?? 0) - (baseMap[key] ?? 0);
    if (delta !== 0) {
      diffs[key] = delta;
    }
  }

  return diffs;
}

export function computeCandidateStatDiffs(
  newTarget: CharacterSnapshot,
  candidate: CharacterSnapshot,
  targetStatsMap: Record<string, number>,
  initialDiffsById: Record<string, Record<string, number>>,
): Record<string, number> | undefined {
  const candStatsMap = extractClassStatMap(candidate);
  const hasTargetStats = Object.keys(targetStatsMap).length > 0;
  const hasCandStats = Object.keys(candStatsMap).length > 0;

  const statDiffs =
    hasTargetStats && hasCandStats
      ? computeStatDiffMap(targetStatsMap, candStatsMap)
      : computeStatDiffMap(
          initialDiffsById[newTarget.id] ?? {},
          initialDiffsById[candidate.id] ?? {},
        );

  return Object.keys(statDiffs).length > 0 ? statDiffs : undefined;
}

export function buildSimilarSnapshotItem(
  newTarget: CharacterSnapshot,
  candidate: CharacterSnapshot,
  targetStatsMap: Record<string, number>,
  initialDiffsById: Record<string, Record<string, number>>,
): SimilarSnapshotItem {
  const exoticArmorMatch = doesExoticArmorMatch(newTarget, candidate);
  const powerWeaponMatch = doesPowerWeaponMatch(newTarget, candidate);
  const statDiffs = computeCandidateStatDiffs(
    newTarget,
    candidate,
    targetStatsMap,
    initialDiffsById,
  );

  return {
    snapshot: candidate,
    tier: exoticArmorMatch ? 'high' : 'base',
    exoticArmorMatch,
    powerWeaponMatch,
    statDiffs,
  };
}

export function recomputeSimilarItems(
  newTarget: CharacterSnapshot,
  allSnapshots: CharacterSnapshot[],
  initialDiffsById: Record<string, Record<string, number>>,
): SimilarSnapshotItem[] {
  const targetStatsMap = extractClassStatMap(newTarget);

  return allSnapshots
    .filter((candidate) => candidate.id !== newTarget.id)
    .map((candidate) =>
      buildSimilarSnapshotItem(
        newTarget,
        candidate,
        targetStatsMap,
        initialDiffsById,
      ),
    )
    .sort((a, b) => {
      if (a.tier === b.tier) return 0;
      return a.tier === 'high' ? -1 : 1;
    });
}
