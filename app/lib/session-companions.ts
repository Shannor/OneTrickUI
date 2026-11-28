import type {
  Aggregate,
  CharacterSnapshot,
  CompanionInstance,
  PlayerStats,
  Session,
  SessionCompanion,
  SessionParticipant,
  StatsValuePair,
} from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { getWeapons } from '~/hooks/use-loadout';
import { getSnapshotSubclassPreview } from '~/lib/match-scoreboard';
import { getItemIconUrl, setBungieUrl } from '~/lib/utils';
import {
  getExoticCatalystState,
  isEnhancedWeapon,
} from '~/lib/weapon-enhancement';

export interface MatchCompanionWeapon {
  itemHash: string;
  name: string;
  icon?: string;
  isEnhanced: boolean;
  hasActiveCatalyst: boolean;
}

export interface MatchCompanion {
  characterId: string;
  userId: string;
  displayName: string;
  characterClass?: string;
  emblemUrl?: string;
  sessionId?: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  kda: number;
  hasPerformance: boolean;
  subclassName?: string;
  subclassIcon?: string;
  weapons: MatchCompanionWeapon[];
}

function getStatNumber(pair?: StatsValuePair): number | undefined {
  return typeof pair?.value === 'number' ? pair.value : undefined;
}

function sameNonZeroFireteamId(
  a?: StatsValuePair,
  b?: StatsValuePair,
): boolean {
  const aVal = getStatNumber(a);
  const bVal = getStatNumber(b);
  if (aVal === undefined || bVal === undefined || aVal === 0 || aVal !== bVal) {
    return false;
  }

  const aDisplay = a?.displayValue;
  const bDisplay = b?.displayValue;
  if (aDisplay && bDisplay && aDisplay !== bDisplay) {
    return false;
  }

  return true;
}

function sameTeamOrStanding(a: PlayerStats, b: PlayerStats): boolean {
  const aTeam = getStatNumber(a.team);
  const bTeam = getStatNumber(b.team);
  if (aTeam !== undefined && bTeam !== undefined) {
    if (aTeam < 0 || bTeam < 0) {
      return false;
    }
    return aTeam === bTeam;
  }
  if (
    (aTeam !== undefined && aTeam < 0) ||
    (bTeam !== undefined && bTeam < 0)
  ) {
    return false;
  }

  const aStanding = getStatNumber(a.standing);
  const bStanding = getStatNumber(b.standing);
  return (
    aStanding !== undefined &&
    bStanding !== undefined &&
    aStanding === bStanding
  );
}

export function areFireteamCompanions(
  a?: PlayerStats,
  b?: PlayerStats,
): boolean {
  if (!a || !b) {
    return false;
  }
  if (!sameNonZeroFireteamId(a.fireTeamId, b.fireTeamId)) {
    return false;
  }
  return sameTeamOrStanding(a, b);
}

export function isCompanionInAggregate(
  aggregate: Aggregate,
  ownerCharacterId: string,
  companionCharacterId: string,
): boolean {
  if (!companionCharacterId || companionCharacterId === ownerCharacterId) {
    return false;
  }
  if (aggregate.activityDetails?.isPrivate) {
    return false;
  }

  const hasLink = Boolean(aggregate.snapshotLinks?.[companionCharacterId]);
  const companionPerf = aggregate.performance?.[companionCharacterId];
  if (!hasLink && !companionPerf) {
    return false;
  }

  const ownerStats = aggregate.performance?.[ownerCharacterId]?.playerStats;
  const companionStats = companionPerf?.playerStats;
  if (!ownerStats || !companionStats) {
    return true;
  }

  const hasFireteamIds =
    getStatNumber(ownerStats.fireTeamId) !== undefined &&
    getStatNumber(companionStats.fireTeamId) !== undefined;
  if (hasFireteamIds) {
    return areFireteamCompanions(ownerStats, companionStats);
  }

  const ownerTeam = getStatNumber(ownerStats.team);
  const companionTeam = getStatNumber(companionStats.team);
  if (ownerTeam !== undefined && companionTeam !== undefined) {
    return ownerTeam >= 0 && companionTeam >= 0 && ownerTeam === companionTeam;
  }

  return true;
}

function compareCompanions(a: SessionCompanion, b: SessionCompanion): number {
  if (b.sharedMatches !== a.sharedMatches) {
    return b.sharedMatches - a.sharedMatches;
  }
  if (b.wins !== a.wins) {
    return b.wins - a.wins;
  }
  const nameDiff = a.displayName
    .toLowerCase()
    .localeCompare(b.displayName.toLowerCase());
  if (nameDiff !== 0) {
    return nameDiff;
  }
  return a.userId.localeCompare(b.userId);
}

function compareCompanionInstances(
  a: CompanionInstance,
  b: CompanionInstance,
): number {
  if (b.sharedMatches !== a.sharedMatches) {
    return b.sharedMatches - a.sharedMatches;
  }
  return a.sessionId.localeCompare(b.sessionId);
}

interface CompanionAccumulator {
  userId: string;
  displayName: string;
  sharedMatches: number;
  wins: number;
  losses: number;
  sessions: Map<string, CompanionInstance>;
}

/**
 * Resolves fireteam companions for a session. Prefers precomputed
 * `session.summary.companions` (zero extra work) and falls back to deriving
 * companions from hydrated `aggregates` + `participants` for active or
 * non-backfilled historical sessions.
 */
export function resolveSessionCompanions(
  session: Session | undefined,
  aggregates: Aggregate[] | undefined,
  participants: Record<string, SessionParticipant> | undefined,
  ownerCharacterId: string,
): SessionCompanion[] {
  const summaryCompanions = session?.summary?.companions;
  if (summaryCompanions && summaryCompanions.length > 0) {
    return summaryCompanions;
  }

  if (!aggregates?.length || !participants) {
    return [];
  }

  const participantEntries = Object.entries(participants);
  if (participantEntries.length === 0) {
    return [];
  }

  const ownerUserId = session?.userId;
  const byUser = new Map<string, CompanionAccumulator>();

  for (const aggregate of aggregates) {
    if (aggregate.activityDetails?.isPrivate) {
      continue;
    }

    const ownerStanding = getStatNumber(
      aggregate.performance?.[ownerCharacterId]?.playerStats?.standing,
    );
    const ownerWon = ownerStanding === 0;
    const seenUsersInMatch = new Set<string>();
    const seenSessionsInMatch = new Set<string>();

    for (const [charId, participant] of participantEntries) {
      if (!participant.userId || participant.userId === ownerUserId) {
        continue;
      }
      if (!isCompanionInAggregate(aggregate, ownerCharacterId, charId)) {
        continue;
      }

      const link = aggregate.snapshotLinks?.[charId];
      const sessionId = link?.sessionId ?? '';
      const displayName =
        participant.displayName || link?.displayName || 'Guardian';
      const characterClass = participant.class || link?.characterClass;
      const emblemUrl = participant.emblemUrl || link?.emblemUrl;

      let acc = byUser.get(participant.userId);
      if (!acc) {
        acc = {
          userId: participant.userId,
          displayName,
          sharedMatches: 0,
          wins: 0,
          losses: 0,
          sessions: new Map(),
        };
        byUser.set(participant.userId, acc);
      } else if (!acc.displayName && displayName) {
        acc.displayName = displayName;
      }

      if (!seenUsersInMatch.has(participant.userId)) {
        seenUsersInMatch.add(participant.userId);
        acc.sharedMatches += 1;
        if (ownerWon) {
          acc.wins += 1;
        } else {
          acc.losses += 1;
        }
      }

      const instanceKey = sessionId || charId;
      let instance = acc.sessions.get(instanceKey);
      if (!instance) {
        instance = {
          sessionId,
          characterId: charId,
          class: characterClass,
          emblemUrl,
          sharedMatches: 0,
        };
        acc.sessions.set(instanceKey, instance);
      } else {
        if (!instance.class && characterClass) {
          instance.class = characterClass;
        }
        if (!instance.emblemUrl && emblemUrl) {
          instance.emblemUrl = emblemUrl;
        }
      }

      const matchInstanceKey = `${participant.userId}:${instanceKey}`;
      if (!seenSessionsInMatch.has(matchInstanceKey)) {
        seenSessionsInMatch.add(matchInstanceKey);
        instance.sharedMatches += 1;
      }
    }
  }

  return Array.from(byUser.values())
    .map((acc) => ({
      userId: acc.userId,
      displayName: acc.displayName,
      sharedMatches: acc.sharedMatches,
      wins: acc.wins,
      losses: acc.losses,
      sessions: Array.from(acc.sessions.values()).sort(
        compareCompanionInstances,
      ),
    }))
    .sort(compareCompanions);
}

export function getCompanionCharacterIds(
  companion: SessionCompanion,
  participants?: Record<string, SessionParticipant>,
): Set<string> {
  const ids = new Set<string>();
  for (const instance of companion.sessions ?? []) {
    if (instance.characterId) {
      ids.add(instance.characterId);
    }
  }
  if (participants) {
    for (const [charId, participant] of Object.entries(participants)) {
      if (participant.userId === companion.userId) {
        ids.add(participant.characterId || charId);
      }
    }
  }
  return ids;
}

export const TEAMMATE_QUERY_PARAM = 'teammate';

export function parseSelectedTeammateIds(
  searchParams: URLSearchParams,
  companions: SessionCompanion[],
): string[] {
  const validUserIds = new Set(companions.map((c) => c.userId));
  const seen = new Set<string>();
  const selected: string[] = [];

  for (const rawId of searchParams.getAll(TEAMMATE_QUERY_PARAM)) {
    if (!rawId || seen.has(rawId) || !validUserIds.has(rawId)) {
      continue;
    }
    seen.add(rawId);
    selected.push(rawId);
  }

  return selected;
}

export function resolveSelectedCompanions(
  searchParams: URLSearchParams,
  companions: SessionCompanion[],
): SessionCompanion[] {
  const selectedIds = new Set(
    parseSelectedTeammateIds(searchParams, companions),
  );
  if (selectedIds.size === 0) {
    return [];
  }
  return companions.filter((c) => selectedIds.has(c.userId));
}

export function formatSelectedCompanionNames(
  companions: SessionCompanion[],
): string {
  if (companions.length === 0) {
    return '';
  }
  if (companions.length === 1) {
    return companions[0].displayName;
  }
  if (companions.length === 2) {
    return `${companions[0].displayName} & ${companions[1].displayName}`;
  }
  const leading = companions
    .slice(0, -1)
    .map((c) => c.displayName)
    .join(', ');
  const last = companions[companions.length - 1].displayName;
  return `${leading} & ${last}`;
}

export function filterAggregatesByCompanions(
  aggregates: Aggregate[],
  ownerCharacterId: string,
  selectedCompanions: SessionCompanion[],
  participants?: Record<string, SessionParticipant>,
): Aggregate[] {
  if (selectedCompanions.length === 0) {
    return aggregates;
  }

  const companionCharIdSets = selectedCompanions.map((companion) =>
    getCompanionCharacterIds(companion, participants),
  );
  if (companionCharIdSets.some((ids) => ids.size === 0)) {
    return [];
  }

  return aggregates.filter((aggregate) =>
    companionCharIdSets.every((charIds) => {
      for (const charId of charIds) {
        if (isCompanionInAggregate(aggregate, ownerCharacterId, charId)) {
          return true;
        }
      }
      return false;
    }),
  );
}

function buildMatchCompanionWeapons(
  snapshot?: CharacterSnapshot,
): MatchCompanionWeapon[] {
  if (!snapshot?.loadout) {
    return [];
  }

  return getWeapons(snapshot.loadout).map((weapon) => ({
    itemHash: String(weapon.itemHash),
    name: weapon.details?.baseInfo?.name ?? weapon.name ?? 'Weapon',
    icon: getItemIconUrl(weapon.details),
    isEnhanced: isEnhancedWeapon(weapon.details),
    hasActiveCatalyst: getExoticCatalystState(weapon.details) === 'active',
  }));
}

export function getMatchCompanions(
  aggregate: Aggregate,
  ownerCharacterId: string,
  ownerUserId: string | undefined,
  participants: Record<string, SessionParticipant> | undefined,
  snapshots: Record<string, CharacterSnapshot> | undefined,
): MatchCompanion[] {
  if (!participants || aggregate.activityDetails?.isPrivate) {
    return [];
  }

  const results: MatchCompanion[] = [];

  for (const [charId, participant] of Object.entries(participants)) {
    if (!participant.userId || participant.userId === ownerUserId) {
      continue;
    }
    if (!isCompanionInAggregate(aggregate, ownerCharacterId, charId)) {
      continue;
    }

    const link = aggregate.snapshotLinks?.[charId];
    const perf = aggregate.performance?.[charId];
    const stats = perf?.playerStats;
    const hasPerformance = Boolean(stats);
    const kills = getStatNumber(stats?.kills) ?? 0;
    const deaths = getStatNumber(stats?.deaths) ?? 0;
    const assists = getStatNumber(stats?.assists) ?? 0;
    const kd = calculateRatio(kills, deaths);
    const kda = calculateRatio(kills + assists, deaths);

    const snapshot =
      link?.snapshotId && snapshots ? snapshots[link.snapshotId] : undefined;
    const subclassPreview = getSnapshotSubclassPreview(snapshot);
    const weapons = buildMatchCompanionWeapons(snapshot);

    results.push({
      characterId: charId,
      userId: participant.userId,
      displayName: participant.displayName || link?.displayName || 'Guardian',
      characterClass: participant.class || link?.characterClass,
      emblemUrl: setBungieUrl(participant.emblemUrl || link?.emblemUrl),
      sessionId: link?.sessionId || undefined,
      kills,
      deaths,
      assists,
      kd,
      kda,
      hasPerformance,
      subclassName: subclassPreview?.name,
      subclassIcon: setBungieUrl(subclassPreview?.icon),
      weapons,
    });
  }

  return results.sort((a, b) => {
    const nameDiff = a.displayName
      .toLowerCase()
      .localeCompare(b.displayName.toLowerCase());
    if (nameDiff !== 0) {
      return nameDiff;
    }
    return a.characterId.localeCompare(b.characterId);
  });
}

export function getCompanionSessionPath(
  userId: string,
  instance: Pick<CompanionInstance, 'characterId' | 'sessionId'>,
): string {
  if (instance.sessionId) {
    return `/profile/${userId}/c/${instance.characterId}/sessions/${instance.sessionId}`;
  }
  return `/profile/${userId}/c/${instance.characterId}`;
}

export function getCompanionPrimaryEmblem(
  companion: SessionCompanion,
): string | undefined {
  for (const instance of companion.sessions ?? []) {
    const resolved = setBungieUrl(instance.emblemUrl);
    if (resolved) {
      return resolved;
    }
  }
  return undefined;
}

export function formatSharedMatchCount(
  sharedMatches: number,
  totalMatches?: number,
): string {
  if (totalMatches !== undefined && totalMatches > sharedMatches) {
    return `${sharedMatches}/${totalMatches} ${totalMatches === 1 ? 'match' : 'matches'}`;
  }
  return `${sharedMatches} ${sharedMatches === 1 ? 'match' : 'matches'}`;
}

export function formatCompanionRecord(wins: number, losses: number): string {
  return `${wins}W-${losses}L`;
}

/**
 * Excludes hydrated fireteam companion snapshots from the session owner's
 * Loadouts tab when `GET /sessions/{sessionId}/aggregates` returns both owner
 * and companion snapshots in the same map.
 */
export function filterOwnerSnapshots(
  snapshots: Record<string, CharacterSnapshot> | undefined,
  characterId: string | undefined,
): CharacterSnapshot[] {
  if (!snapshots) {
    return [];
  }
  const all = Object.values(snapshots);
  if (!characterId) {
    return all;
  }
  return all.filter(
    (snapshot) => !snapshot.characterId || snapshot.characterId === characterId,
  );
}
