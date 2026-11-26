import { User } from 'lucide-react';
import type { ReactNode } from 'react';
import { Form, Link, useLocation } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import { cn } from '~/lib/utils';

import { useFireteam } from './fireteam-context';
import { useFireteamMember } from './fireteam-member-context';

function getMemberCardBorderClass(
  isActive: boolean,
  isSelectedForBulk: boolean,
): string {
  if (isActive) {
    return 'border-emerald-500/35';
  }
  if (isSelectedForBulk) {
    return 'border-primary/40';
  }
  return 'border-border';
}

export function MemberBulkToggle() {
  const { isSubmitting, toggleMemberBulkSelect } = useFireteam();
  const {
    member,
    memberKey,
    effectiveCharId,
    isSelectedCharActive,
    isSelectedForBulk,
  } = useFireteamMember();

  if (isSelectedCharActive) {
    return null;
  }

  const isDisabled = isSubmitting || !effectiveCharId;

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
        onChange={(e) => toggleMemberBulkSelect(memberKey, e.target.checked)}
        aria-label={`Include ${member.displayName} in Fireteam start`}
        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
      />
      <span>Include</span>
    </label>
  );
}

export function MemberCardHeader() {
  const { member, memberKey, effectiveCharId } = useFireteamMember();

  const profilePath = effectiveCharId
    ? `/profile/${memberKey}/c/${effectiveCharId}`
    : `/profile/${memberKey}`;

  return (
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
        <MemberBulkToggle />
      </div>
    </div>
  );
}

export function MemberCharacterForm() {
  const location = useLocation();
  const { isSubmitting, selectMemberCharacter } = useFireteam();
  const { member, memberKey, savedCharId } = useFireteamMember();

  return (
    <Form
      action="/action/set-fireteam"
      method="post"
      className="flex flex-col gap-4"
    >
      <input hidden value={memberKey} name="userId" readOnly />
      <input
        hidden
        value={`${location.pathname}${location.search}`}
        name="redirect"
        readOnly
      />
      <CharacterPicker
        characters={member.characters ?? []}
        currentCharacterId={savedCharId}
        onCharacterSelect={(nextCharId) =>
          selectMemberCharacter(memberKey, nextCharId)
        }
      >
        {(current, previous) => {
          const isDisabled =
            (Boolean(current) && Boolean(previous) && current === previous) ||
            !current;
          return (
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isDisabled}
              className="w-full font-medium"
            >
              {savedCharId ? 'Change Guardian' : 'Pick a Guardian'}
            </LoadingButton>
          );
        }}
      </CharacterPicker>
    </Form>
  );
}

export interface FireteamMemberCardProps {
  children?: ReactNode;
}

export function FireteamMemberCard({ children }: FireteamMemberCardProps) {
  const { isSelectedCharActive, isSelectedForBulk } = useFireteamMember();

  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-5 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-border/80',
        getMemberCardBorderClass(isSelectedCharActive, isSelectedForBulk),
      )}
    >
      {children}
    </div>
  );
}
