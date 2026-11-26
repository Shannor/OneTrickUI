import type {
  CompTracking,
  FireteamActiveSession,
  FireteamMember,
  FireteamSessionMemberTarget,
  FireteamSessionOutcome,
  FireteamSessionResult,
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

export type StartFireteamSessionsActionData =
  | {
      ok: true;
      results: FireteamSessionResult[];
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

export function buildFireteamCharacterMap(
  members: FireteamMember[],
  selectedCharacters?: Record<string, string>,
): Record<string, string> {
  const withCharacters: Record<string, string> = {};

  for (const member of members) {
    const memberKey = getMemberKey(member);
    const charId = resolveMemberDefaultCharacterId(member, selectedCharacters);
    if (!charId || !memberKey) continue;

    if (member.id) {
      withCharacters[member.id] = charId;
    }
    if (member.membershipId) {
      withCharacters[member.membershipId] = charId;
    }
  }

  return withCharacters;
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
  result: FireteamSessionResult,
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
  bulkResults?: FireteamSessionResult[],
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
  bulkResults?: FireteamSessionResult[],
): FireteamSessionOutcome | undefined {
  if (!bulkResults || bulkResults.length === 0) return undefined;

  const matching = bulkResults.filter(
    (r) =>
      (member.id && r.userId === member.id) ||
      (member.membershipId && r.userId === member.membershipId),
  );
  if (matching.length === 0) return undefined;

  if (characterId) {
    return matching.find((r) => r.characterId === characterId)?.outcome;
  }

  return matching[0]?.outcome;
}

export interface FireteamMemberView {
  member: FireteamMember;
  memberKey: string;
  savedCharId?: string;
  effectiveCharId?: string;
  activeSessions: MemberSessionData[];
  selectedActiveSession?: MemberSessionData;
  otherActiveSession?: MemberSessionData;
  otherActiveCharacterClass?: string;
  isSelectedCharActive: boolean;
  hasAnyActive: boolean;
  isReadyToStart: boolean;
  isSelectedForBulk: boolean;
  bulkOutcome?: FireteamSessionOutcome;
}

export interface FireteamViewModel {
  memberViews: FireteamMemberView[];
  memberNames: Record<string, string>;
  selectedTargets: FireteamSessionMemberTarget[];
  readyCount: number;
  activeHeaderCount: number;
  activeSelectedCount: number;
}

export interface BuildFireteamViewModelInput {
  members: FireteamMember[];
  fireteamMemWithCharacters: Record<string, string>;
  draftCharacters: Record<string, string>;
  excludedMemberIds: Record<string, boolean>;
  bulkResults?: FireteamSessionResult[];
  visibleResults?: FireteamSessionResult[];
}

export function buildFireteamViewModel({
  members,
  fireteamMemWithCharacters,
  draftCharacters,
  excludedMemberIds,
  bulkResults,
  visibleResults,
}: BuildFireteamViewModelInput): FireteamViewModel {
  const memberViews: FireteamMemberView[] = [];
  const memberNames: Record<string, string> = {};
  const selectedTargets: FireteamSessionMemberTarget[] = [];
  let readyCount = 0;
  let activeHeaderCount = 0;
  let activeSelectedCount = 0;

  for (const member of members) {
    const memberKey = getMemberKey(member);
    if (member.id) {
      memberNames[member.id] = member.displayName;
    }
    if (member.membershipId) {
      memberNames[member.membershipId] = member.displayName;
    }

    const savedCharId =
      (member.id ? fireteamMemWithCharacters[member.id] : undefined) ??
      (member.membershipId
        ? fireteamMemWithCharacters[member.membershipId]
        : undefined);
    const effectiveCharId = draftCharacters[memberKey] ?? savedCharId;
    const activeSessions = getMemberActiveSessions(member, bulkResults);

    const selectedActiveSession = effectiveCharId
      ? activeSessions.find(
          (s) => s.characterId === effectiveCharId && s.status === 'pending',
        )
      : undefined;
    const otherActiveSession = selectedActiveSession
      ? undefined
      : activeSessions.find((s) => s.status === 'pending');
    const otherActiveCharacterClass = otherActiveSession
      ? member.characters?.find((c) => c.id === otherActiveSession.characterId)
          ?.class
      : undefined;

    const isSelectedCharActive = Boolean(selectedActiveSession);
    const hasAnyActive = isSelectedCharActive || Boolean(otherActiveSession);
    const isReadyToStart = !isSelectedCharActive && Boolean(effectiveCharId);
    const isSelectedForBulk = isReadyToStart && !excludedMemberIds[memberKey];
    const bulkOutcome = findMemberBulkOutcome(
      member,
      effectiveCharId,
      visibleResults,
    );

    if (isReadyToStart) {
      readyCount += 1;
    }
    if (hasAnyActive) {
      activeHeaderCount += 1;
    }
    if (isSelectedCharActive) {
      activeSelectedCount += 1;
    }
    if (isSelectedForBulk && effectiveCharId) {
      selectedTargets.push({
        userId: memberKey,
        characterId: effectiveCharId,
      });
    }

    memberViews.push({
      member,
      memberKey,
      savedCharId,
      effectiveCharId,
      activeSessions,
      selectedActiveSession,
      otherActiveSession,
      otherActiveCharacterClass,
      isSelectedCharActive,
      hasAnyActive,
      isReadyToStart,
      isSelectedForBulk,
      bulkOutcome,
    });
  }

  return {
    memberViews,
    memberNames,
    selectedTargets,
    readyCount,
    activeHeaderCount,
    activeSelectedCount,
  };
}

export interface BulkStartSummary {
  title: string;
  startedCount: number;
  skippedCount: number;
}

export function formatBulkStartSummary(
  results: FireteamSessionResult[],
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
