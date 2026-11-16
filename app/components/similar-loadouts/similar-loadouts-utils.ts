import type { CharacterSnapshot } from '~/api';

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
