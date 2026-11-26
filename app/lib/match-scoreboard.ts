import type {
  ActivityParticipant,
  CharacterSnapshot,
  Team,
  WeaponInstanceMetrics,
} from '~/api';
import { calculateRatio } from '~/calculations/precision';

const KINETIC_BUCKET_HASH = 1498876634;
const ENERGY_BUCKET_HASH = 2465295065;
const POWER_BUCKET_HASH = 953998645;
const POWER_ALT_BUCKET_HASH = 953926928;
const SUBCLASS_BUCKET_HASH = '3284755031';
const ARMOR_BUCKET_HASHES = new Set([
  '3448274439',
  '3551918588',
  '14239492',
  '20886954',
  '1585787867',
]);
const EXOTIC_TIER_TYPE = 6;
const DEFAULT_WEAPON_SLOT_ORDER = 99;
const TEAM_PAIR_COUNT = 2;
const MIN_FIRETEAM_STACK_SIZE = 2;
const BUNGIE_INT32_MIN_OVERFLOW = '-2147483648';

const WEAPON_BUCKET_ORDER: Record<number, number> = {
  [KINETIC_BUCKET_HASH]: 1,
  [ENERGY_BUCKET_HASH]: 2,
  [POWER_BUCKET_HASH]: 3,
  [POWER_ALT_BUCKET_HASH]: 3,
};

export type ParticipantTrackingKind = 'loadout' | 'session' | 'none';
export type ScoreboardTeamTone = 'alpha' | 'bravo' | 'neutral';

export interface ParticipantItemPreview {
  name: string;
  icon?: string;
}

export interface ParticipantStatsSummary {
  kills: number;
  deaths: number;
  assists: number;
  kd: string;
  efficiency: string;
  scoreDisplay?: string;
}

export interface ScoreboardParticipantEntry {
  participant: ActivityParticipant;
  snapshot?: CharacterSnapshot;
  subclass?: ParticipantItemPreview;
  exoticArmor?: ParticipantItemPreview;
  trackingKind: ParticipantTrackingKind;
  stats: ParticipantStatsSummary;
  weapons: WeaponInstanceMetrics[];
  fireteamGroupIndex?: number;
  fireteamStackSize?: number;
}

export interface ScoreboardTeamGroup {
  id: string;
  label: string;
  teamTone: ScoreboardTeamTone;
  standing?: string;
  score?: string;
  hasTrackedPlayers: boolean;
  entries: ScoreboardParticipantEntry[];
}

export interface MatchScoreboardCounts {
  participantCount: number;
  trackedLoadoutCount: number;
  trackedSessionCount: number;
  trackedPlayerCount: number;
}

export interface MatchScoreboardViewModel {
  mode: 'teams' | 'ffa';
  groups: ScoreboardTeamGroup[];
  counts: MatchScoreboardCounts;
}

export interface BuildMatchScoreboardInput {
  participants: ActivityParticipant[];
  teams: Team[];
  snapshots: Record<string, CharacterSnapshot>;
}

export function getParticipantTrackingKind(
  participant: ActivityParticipant,
  snapshots: Record<string, CharacterSnapshot>,
): ParticipantTrackingKind {
  if (participant.snapshotId && snapshots[participant.characterId]) {
    return 'loadout';
  }
  if (participant.sessionId) {
    return 'session';
  }
  return 'none';
}

export function countTrackedParticipants(
  participants: ActivityParticipant[],
  snapshots: Record<string, CharacterSnapshot>,
): MatchScoreboardCounts {
  let trackedLoadoutCount = 0;
  let trackedSessionCount = 0;
  let trackedPlayerCount = 0;

  for (const participant of participants) {
    const hasLoadout = Boolean(
      participant.snapshotId && snapshots[participant.characterId],
    );
    const hasSession = Boolean(participant.sessionId);

    if (hasLoadout) {
      trackedLoadoutCount += 1;
    }
    if (hasSession) {
      trackedSessionCount += 1;
    }
    if (hasLoadout || hasSession) {
      trackedPlayerCount += 1;
    }
  }

  return {
    participantCount: participants.length,
    trackedLoadoutCount,
    trackedSessionCount,
    trackedPlayerCount,
  };
}

export function resolveFireteamKey(
  participant: ActivityParticipant,
): string | undefined {
  const direct = participant.fireteamId?.trim();
  if (direct && direct !== '0' && direct !== BUNGIE_INT32_MIN_OVERFLOW) {
    return direct;
  }

  const rawValue = participant.performance?.playerStats?.fireTeamId?.value;
  if (
    typeof rawValue === 'number' &&
    Number.isFinite(rawValue) &&
    rawValue !== 0 &&
    String(rawValue) !== BUNGIE_INT32_MIN_OVERFLOW
  ) {
    return String(rawValue);
  }

  return undefined;
}

export function getWeaponKillsCount(weapon: WeaponInstanceMetrics): number {
  return Number(weapon.stats?.uniqueWeaponKills?.basic?.value ?? 0);
}

export function getWeaponDisplayName(weapon: WeaponInstanceMetrics): string {
  return weapon.properties?.baseInfo?.name ?? weapon.display?.name ?? '';
}

function getWeaponSlotOrder(weapon: WeaponInstanceMetrics): number {
  const rawBucket =
    weapon.properties?.baseInfo?.bucketHash ?? weapon.bucketHash ?? 0;
  const bucketHash = Number(rawBucket);
  return WEAPON_BUCKET_ORDER[bucketHash] ?? DEFAULT_WEAPON_SLOT_ORDER;
}

export function sortParticipantWeapons(
  weaponsMap?: Record<string, WeaponInstanceMetrics>,
): WeaponInstanceMetrics[] {
  if (!weaponsMap) {
    return [];
  }

  const weapons: WeaponInstanceMetrics[] = [];
  for (const weapon of Object.values(weaponsMap)) {
    if (weapon && getWeaponDisplayName(weapon)) {
      weapons.push(weapon);
    }
  }

  return weapons.sort((a, b) => {
    const slotDiff = getWeaponSlotOrder(a) - getWeaponSlotOrder(b);
    if (slotDiff !== 0) {
      return slotDiff;
    }
    return getWeaponKillsCount(b) - getWeaponKillsCount(a);
  });
}

export function computeParticipantStats(
  participant: ActivityParticipant,
): ParticipantStatsSummary {
  const playerStats = participant.performance?.playerStats;
  const kills = playerStats?.kills?.value ?? 0;
  const deaths = playerStats?.deaths?.value ?? 0;
  const assists = playerStats?.assists?.value ?? 0;
  const kd = calculateRatio(kills, deaths);
  const efficiency = calculateRatio(kills + assists, deaths);

  return {
    kills,
    deaths,
    assists,
    kd: kd.toFixed(2),
    efficiency: efficiency.toFixed(2),
    scoreDisplay: participant.score?.displayValue,
  };
}

function compareByPerformanceDesc(
  a: ActivityParticipant,
  b: ActivityParticipant,
): number {
  if (a.completed !== b.completed) {
    return a.completed ? -1 : 1;
  }

  const scoreDiff = (b.score?.value ?? 0) - (a.score?.value ?? 0);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  const killsDiff =
    (b.performance?.playerStats?.kills?.value ?? 0) -
    (a.performance?.playerStats?.kills?.value ?? 0);
  if (killsDiff !== 0) {
    return killsDiff;
  }

  const kdaDiff =
    (b.performance?.playerStats?.kda?.value ?? 0) -
    (a.performance?.playerStats?.kda?.value ?? 0);
  if (kdaDiff !== 0) {
    return kdaDiff;
  }

  return a.displayName.localeCompare(b.displayName);
}

function compareForFfaStandings(
  a: ActivityParticipant,
  b: ActivityParticipant,
): number {
  if (a.completed !== b.completed) {
    return a.completed ? -1 : 1;
  }

  const standingDiff = a.standing - b.standing;
  if (standingDiff !== 0) {
    return standingDiff;
  }
  return compareByPerformanceDesc(a, b);
}

function getAlphaTeamId(teams: Team[]): string {
  if (teams.length !== TEAM_PAIR_COUNT) {
    return '';
  }
  const [first, second] = teams;
  return Number(first.id) < Number(second.id) ? first.id : second.id;
}

export function getSnapshotSubclassPreview(
  snapshot?: CharacterSnapshot,
): ParticipantItemPreview | undefined {
  const itemSnapshot = snapshot?.loadout?.[SUBCLASS_BUCKET_HASH];
  if (!itemSnapshot) {
    return undefined;
  }

  const name =
    itemSnapshot.details?.baseInfo?.name || itemSnapshot.name || undefined;
  const icon = itemSnapshot.details?.baseInfo?.icon || undefined;

  if (!name && !icon) {
    return undefined;
  }

  return {
    name: name ?? 'Subclass',
    icon,
  };
}

export function getSnapshotExoticArmorPreview(
  snapshot?: CharacterSnapshot,
): ParticipantItemPreview | undefined {
  if (!snapshot?.loadout) {
    return undefined;
  }

  for (const [bucketKey, itemSnapshot] of Object.entries(snapshot.loadout)) {
    const resolvedBucket = String(
      itemSnapshot?.bucketHash ??
        itemSnapshot?.details?.baseInfo?.bucketHash ??
        bucketKey,
    );
    if (!ARMOR_BUCKET_HASHES.has(resolvedBucket)) {
      continue;
    }

    const baseInfo = itemSnapshot.details?.baseInfo;
    const isExotic =
      baseInfo?.tierType === EXOTIC_TIER_TYPE ||
      baseInfo?.tierTypeName?.toLowerCase() === 'exotic';

    if (!isExotic) {
      continue;
    }

    const name = baseInfo?.name || itemSnapshot.name;
    const icon = baseInfo?.icon || undefined;
    if (name || icon) {
      return {
        name: name || 'Exotic Armor',
        icon,
      };
    }
  }

  return undefined;
}

function buildGroupEntries(
  groupParticipants: ActivityParticipant[],
  snapshots: Record<string, CharacterSnapshot>,
): { entries: ScoreboardParticipantEntry[]; hasTrackedPlayers: boolean } {
  const fireteamCounts = new Map<string, number>();
  for (const participant of groupParticipants) {
    const key = resolveFireteamKey(participant);
    if (key) {
      fireteamCounts.set(key, (fireteamCounts.get(key) ?? 0) + 1);
    }
  }

  const fireteamIndexMap = new Map<string, number>();
  let nextFireteamIndex = 1;
  let hasTrackedPlayers = false;

  const entries = groupParticipants.map((participant) => {
    const key = resolveFireteamKey(participant);
    const stackSize = key ? (fireteamCounts.get(key) ?? 0) : 0;

    let fireteamGroupIndex: number | undefined;
    let fireteamStackSize: number | undefined;

    if (key && stackSize >= MIN_FIRETEAM_STACK_SIZE) {
      let existingIndex = fireteamIndexMap.get(key);
      if (existingIndex === undefined) {
        existingIndex = nextFireteamIndex;
        fireteamIndexMap.set(key, existingIndex);
        nextFireteamIndex += 1;
      }
      fireteamGroupIndex = existingIndex;
      fireteamStackSize = stackSize;
    }

    const snapshot = snapshots[participant.characterId];
    const trackingKind = getParticipantTrackingKind(participant, snapshots);
    if (trackingKind !== 'none') {
      hasTrackedPlayers = true;
    }

    return {
      participant,
      snapshot,
      subclass: getSnapshotSubclassPreview(snapshot),
      exoticArmor: getSnapshotExoticArmorPreview(snapshot),
      trackingKind,
      stats: computeParticipantStats(participant),
      weapons: sortParticipantWeapons(participant.performance?.weapons),
      fireteamGroupIndex,
      fireteamStackSize,
    };
  });

  return {
    entries,
    hasTrackedPlayers,
  };
}

function resolveTeamLabel(
  team: Team,
  alphaId: string,
): { label: string; teamTone: ScoreboardTeamTone } {
  if (alphaId && team.id === alphaId) {
    return { label: 'Alpha', teamTone: 'alpha' };
  }
  if (alphaId) {
    return { label: 'Bravo', teamTone: 'bravo' };
  }
  return { label: team.teamName || `Team ${team.id}`, teamTone: 'neutral' };
}

export function buildMatchScoreboardViewModel({
  participants,
  teams,
  snapshots,
}: BuildMatchScoreboardInput): MatchScoreboardViewModel {
  const counts = countTrackedParticipants(participants, snapshots);

  if (participants.length === 0) {
    return { mode: 'ffa', groups: [], counts };
  }

  const teamBuckets = new Map<string, ActivityParticipant[]>();
  const unassigned: ActivityParticipant[] = [];

  for (const participant of participants) {
    if (participant.teamId) {
      const bucket = teamBuckets.get(participant.teamId);
      if (bucket) {
        bucket.push(participant);
      } else {
        teamBuckets.set(participant.teamId, [participant]);
      }
    } else {
      unassigned.push(participant);
    }
  }

  const hasMultipleTeams =
    teams.length >= TEAM_PAIR_COUNT && teamBuckets.size >= TEAM_PAIR_COUNT;

  if (!hasMultipleTeams) {
    const sorted = [...participants].sort(compareForFfaStandings);
    const { entries, hasTrackedPlayers } = buildGroupEntries(sorted, snapshots);
    return {
      mode: 'ffa',
      counts,
      groups: [
        {
          id: 'standings',
          label: 'Standings',
          teamTone: 'neutral',
          hasTrackedPlayers,
          entries,
        },
      ],
    };
  }

  const alphaId = getAlphaTeamId(teams);
  const orderedTeams = [...teams].sort((a, b) => {
    if (a.id === alphaId) return -1;
    if (b.id === alphaId) return 1;
    return Number(a.id) - Number(b.id);
  });

  const groups: ScoreboardTeamGroup[] = [];
  const consumedTeamIds = new Set<string>();

  for (const team of orderedTeams) {
    consumedTeamIds.add(team.id);
    const members = [...(teamBuckets.get(team.id) ?? [])].sort(
      compareByPerformanceDesc,
    );
    const { label, teamTone } = resolveTeamLabel(team, alphaId);
    const { entries, hasTrackedPlayers } = buildGroupEntries(
      members,
      snapshots,
    );
    groups.push({
      id: team.id,
      label,
      teamTone,
      standing: team.standing,
      score: team.score,
      hasTrackedPlayers,
      entries,
    });
  }

  for (const [teamId, members] of teamBuckets.entries()) {
    if (consumedTeamIds.has(teamId)) {
      continue;
    }
    const sorted = [...members].sort(compareByPerformanceDesc);
    const { entries, hasTrackedPlayers } = buildGroupEntries(sorted, snapshots);
    groups.push({
      id: teamId,
      label: `Team ${teamId}`,
      teamTone: 'neutral',
      hasTrackedPlayers,
      entries,
    });
  }

  if (unassigned.length > 0) {
    const sorted = [...unassigned].sort(compareByPerformanceDesc);
    const { entries, hasTrackedPlayers } = buildGroupEntries(sorted, snapshots);
    groups.push({
      id: 'other',
      label: 'Other Participants',
      teamTone: 'neutral',
      hasTrackedPlayers,
      entries,
    });
  }

  return {
    mode: 'teams',
    groups,
    counts,
  };
}
