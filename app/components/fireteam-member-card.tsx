import { Shield, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { Form, Link, useLocation } from 'react-router';
import type { FireteamMember } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import { cn } from '~/lib/utils';

function getMemberCardBorderClass(
  isActive: boolean,
  isSelectedForBulk: boolean,
  hasBulkToggle: boolean,
): string {
  if (isActive) {
    return 'border-emerald-500/35';
  }
  if (isSelectedForBulk && hasBulkToggle) {
    return 'border-primary/40';
  }
  return 'border-border';
}

interface MemberCardHeaderActionProps {
  displayName: string;
  isActive: boolean;
  isSelectedForBulk: boolean;
  isDisabled: boolean;
  onToggleBulkSelect?: (selected: boolean) => void;
}

function MemberCardHeaderAction({
  displayName,
  isActive,
  isSelectedForBulk,
  isDisabled,
  onToggleBulkSelect,
}: MemberCardHeaderActionProps) {
  if (isActive) {
    return null;
  }

  if (!onToggleBulkSelect) {
    return <Shield className="h-4 w-4 shrink-0 text-muted-foreground/60" />;
  }

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
        isSelectedForBulk
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground',
        isDisabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="checkbox"
        checked={isSelectedForBulk}
        disabled={isDisabled}
        onChange={(e) => onToggleBulkSelect(e.target.checked)}
        aria-label={`Include ${displayName} in Fireteam start`}
        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
      />
      <span>Include</span>
    </label>
  );
}

export interface FireteamMemberCardProps {
  member: FireteamMember;
  characterId?: string;
  selectedCharacterId?: string;
  isActive?: boolean;
  isSelectedForBulk?: boolean;
  onToggleBulkSelect?: (selected: boolean) => void;
  onCharacterSelect?: (characterId?: string | null) => void;
  isSubmitting?: boolean;
  children?: ReactNode;
}

export function FireteamMemberCard({
  member,
  characterId,
  selectedCharacterId,
  isActive = false,
  isSelectedForBulk = false,
  onToggleBulkSelect,
  onCharacterSelect,
  isSubmitting = false,
  children,
}: FireteamMemberCardProps) {
  const location = useLocation();
  const userId = member.id || member.membershipId;
  const effectiveCharacterId = selectedCharacterId ?? characterId;

  const profilePath = effectiveCharacterId
    ? `/profile/${userId}/c/${effectiveCharacterId}`
    : `/profile/${userId}`;

  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-5 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-border/80',
        getMemberCardBorderClass(
          isActive,
          isSelectedForBulk,
          Boolean(onToggleBulkSelect),
        ),
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
            <MemberCardHeaderAction
              displayName={member.displayName}
              isActive={isActive}
              isSelectedForBulk={isSelectedForBulk}
              isDisabled={isSubmitting || !effectiveCharacterId}
              onToggleBulkSelect={onToggleBulkSelect}
            />
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

      {children}
    </div>
  );
}
