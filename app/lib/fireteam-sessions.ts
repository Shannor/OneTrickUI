import type {
  CompTracking,
  FireteamActiveSession,
  FireteamMember,
  FireteamSessionOutcome,
} from '~/api';

export interface MemberSessionData {
  id: string;
  name?: string;
  status?: 'pending' | 'complete';
  aggregateIds?: string[];
  userId: string;
  characterId: string;
  startedAt?: Date | string;
  trackComp?: boolean;
  compTracking?: CompTracking;
}

export interface BulkFireteamSessionResult {
  userId: string;
  characterId: string;
  outcome: FireteamSessionOutcome;
  session: {
    id: string;
    userId: string;
    characterId: string;
    startedAt: string;
    status?: 'pending' | 'complete';
    name?: string;
    aggregateIds: string[];
    compTracking?: CompTracking;
  };
}

export type StartFireteamSessionsActionData =
  | {
      ok: true;
      results: BulkFireteamSessionResult[];
    }
  | {
      ok: false;
      error: string;
    };

export function getMemberKey(
  member: Pick<FireteamMember, 'id' | 'membershipId'>,
): string {
  return member.id || member.membershipId;
}

export function resolveMemberDefaultCharacterId(
  member: FireteamMember,
  selectedCharacters?: Record<string, string>,
): string | undefined {
  const prefChar =
    (member.id ? selectedCharacters?.[member.id] : undefined) ??
    (member.membershipId
      ? selectedCharacters?.[member.membershipId]
      : undefined);

  const characters = member.characters ?? [];
  if (
    prefChar &&
    (characters.length === 0 || characters.some((c) => c.id === prefChar))
  ) {
    return prefChar;
  }

  const activeSessionChar = member.activeSessions?.find(
    (s) =>
      Boolean(s.characterId) &&
      (characters.length === 0 ||
        characters.some((c) => c.id === s.characterId)),
  )?.characterId;

  return activeSessionChar ?? characters[0]?.id;
}

export function toMemberSessionData(
  userId: string,
  activeSession: FireteamActiveSession,
): MemberSessionData {
  return {
    id: activeSession.sessionId,
    userId,
    characterId: activeSession.characterId,
    status: 'pending',
    startedAt: activeSession.startedAt,
    trackComp: activeSession.trackComp,
  };
}

export function toBulkResultSessionData(
  result: BulkFireteamSessionResult,
): MemberSessionData {
  const { session } = result;
  return {
    id: session.id,
    userId: session.userId || result.userId,
    characterId: session.characterId || result.characterId,
    name: session.name,
    status: session.status ?? 'pending',
    aggregateIds: session.aggregateIds,
    startedAt: session.startedAt,
    trackComp: session.compTracking?.enabled,
    compTracking: session.compTracking,
  };
}

export function getMemberActiveSessions(
  member: FireteamMember,
  bulkResults?: BulkFireteamSessionResult[],
): MemberSessionData[] {
  const userId = getMemberKey(member);
  const byCharacter = new Map<string, MemberSessionData>();

  for (const active of member.activeSessions ?? []) {
    if (!active.sessionId || !active.characterId) continue;
    byCharacter.set(active.characterId, toMemberSessionData(userId, active));
  }

  for (const result of bulkResults ?? []) {
    const matchesMember =
      (member.id && result.userId === member.id) ||
      (member.membershipId && result.userId === member.membershipId);
    if (!matchesMember) continue;

    const mapped = toBulkResultSessionData(result);
    if (mapped.characterId) {
      byCharacter.set(mapped.characterId, mapped);
    }
  }

  return Array.from(byCharacter.values());
}

export function findMemberBulkOutcome(
  member: FireteamMember,
  characterId: string | undefined,
  bulkResults?: BulkFireteamSessionResult[],
): FireteamSessionOutcome | undefined {
  if (!bulkResults || bulkResults.length === 0) return undefined;

  const matching = bulkResults.filter(
    (r) =>
      (member.id && r.userId === member.id) ||
      (member.membershipId && r.userId === member.membershipId),
  );
  if (matching.length === 0) return undefined;

  if (characterId) {
    const exact = matching.find((r) => r.characterId === characterId);
    if (exact) return exact.outcome;
  }

  return matching[0]?.outcome;
}

export interface BulkStartSummary {
  title: string;
  startedCount: number;
  skippedCount: number;
}

export function formatBulkStartSummary(
  results: BulkFireteamSessionResult[],
): BulkStartSummary {
  let startedCount = 0;
  let skippedCount = 0;

  for (const result of results) {
    if (result.outcome === 'started') {
      startedCount += 1;
    } else if (result.outcome === 'skipped_active') {
      skippedCount += 1;
    }
  }

  if (startedCount > 0 && skippedCount > 0) {
    const startedLabel = startedCount === 1 ? 'session' : 'sessions';
    return {
      title: `Started ${startedCount} ${startedLabel}; skipped ${skippedCount} already active.`,
      startedCount,
      skippedCount,
    };
  }

  if (startedCount > 0) {
    const startedLabel =
      startedCount === 1 ? 'fireteam session' : 'fireteam sessions';
    return {
      title: `Started ${startedCount} ${startedLabel}.`,
      startedCount,
      skippedCount,
    };
  }

  if (skippedCount > 0) {
    return {
      title:
        skippedCount === 1
          ? '1 teammate already has an active session.'
          : `${skippedCount} teammates already have active sessions.`,
      startedCount,
      skippedCount,
    };
  }

  return {
    title: 'No sessions were started.',
    startedCount,
    skippedCount,
  };
}
