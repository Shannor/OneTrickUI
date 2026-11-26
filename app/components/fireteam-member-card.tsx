import { Shield, User } from 'lucide-react';
import { Form, Link, useLocation } from 'react-router';
import type { FireteamMember, FireteamSessionOutcome } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import {
  MemberSessionStatus,
  type SessionData,
} from '~/components/member-session-status';
import { cn } from '~/lib/utils';

interface FireteamMemberCardProps {
  member: FireteamMember;
  characterId?: string;
  selectedCharacterId?: string;
  session?: SessionData;
  activeSessions?: SessionData[];
  bulkOutcome?: FireteamSessionOutcome;
  isSelectedForBulk?: boolean;
  onToggleBulkSelect?: (selected: boolean) => void;
  onCharacterSelect?: (characterId?: string | null) => void;
  isSubmitting?: boolean;
}

export function FireteamMemberCard({
  member,
  characterId,
  selectedCharacterId,
  session,
  activeSessions = [],
  bulkOutcome,
  isSelectedForBulk = false,
  onToggleBulkSelect,
  onCharacterSelect,
  isSubmitting = false,
}: FireteamMemberCardProps) {
  const location = useLocation();
  const userId = member.id || member.membershipId;
  const effectiveCharacterId = selectedCharacterId ?? characterId;

  const selectedActiveSession =
    activeSessions.find((s) => s.characterId === effectiveCharacterId) ??
    (session?.status === 'pending' ? session : undefined);

  const otherActiveSession = selectedActiveSession
    ? undefined
    : activeSessions.find((s) => s.status === 'pending');

  const otherActiveCharacterClass = otherActiveSession
    ? member.characters?.find((c) => c.id === otherActiveSession.characterId)
        ?.class
    : undefined;

  const isSelectedCharActive = selectedActiveSession?.status === 'pending';

  const profilePath = effectiveCharacterId
    ? `/profile/${userId}/c/${effectiveCharacterId}`
    : `/profile/${userId}`;

  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-5 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-border/80',
        isSelectedCharActive
          ? 'border-emerald-500/35'
          : isSelectedForBulk && onToggleBulkSelect
            ? 'border-primary/40'
            : 'border-border',
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <Link
              to={profilePath}
              className="truncate text-lg font-bold tracking-tight transition-colors hover:text-primary"
            >
              {member.displayName}
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isSelectedCharActive && onToggleBulkSelect ? (
              <label
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                  isSelectedForBulk
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground',
                  (isSubmitting || !effectiveCharacterId) &&
                    'cursor-not-allowed opacity-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelectedForBulk}
                  disabled={isSubmitting || !effectiveCharacterId}
                  onChange={(e) => onToggleBulkSelect(e.target.checked)}
                  aria-label={`Include ${member.displayName} in Fireteam start`}
                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                />
                <span>Include</span>
              </label>
            ) : (
              !isSelectedCharActive && (
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              )
            )}
          </div>
        </div>

        <Form
          action="/action/set-fireteam"
          method="post"
          className="flex flex-col gap-4"
        >
          <input hidden value={userId} name="userId" readOnly />
          <input
            hidden
            value={`${location.pathname}${location.search}`}
            name="redirect"
            readOnly
          />
          <CharacterPicker
            characters={member.characters ?? []}
            currentCharacterId={characterId}
            onCharacterSelect={onCharacterSelect}
          >
            {(current, previous) => {
              const isDisabled =
                (Boolean(current) &&
                  Boolean(previous) &&
                  current === previous) ||
                !current;
              return (
                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isDisabled}
                  className="w-full font-medium"
                >
                  {characterId ? 'Change Guardian' : 'Pick a Guardian'}
                </LoadingButton>
              );
            }}
          </CharacterPicker>
        </Form>
      </div>

      <MemberSessionStatus
        session={selectedActiveSession ?? session}
        otherActiveSession={otherActiveSession}
        otherActiveCharacterClass={otherActiveCharacterClass}
        bulkOutcome={bulkOutcome}
        userId={userId}
        characterId={effectiveCharacterId}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
