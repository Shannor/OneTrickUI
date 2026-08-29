import { Shield, User } from 'lucide-react';
import { Form, Link, useLocation } from 'react-router';
import type { FireteamMember } from '~/api';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import {
  MemberSessionStatus,
  type SessionData,
} from '~/components/member-session-status';

interface FireteamMemberCardProps {
  member: FireteamMember;
  characterId?: string;
  session?: SessionData;
  isSubmitting?: boolean;
}

export function FireteamMemberCard({
  member,
  characterId,
  session,
  isSubmitting = false,
}: FireteamMemberCardProps) {
  const location = useLocation();

  const profilePath = characterId
    ? `/profile/${member.id}/c/${characterId}`
    : `/profile/${member.id}`;

  return (
    <div className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-border/80">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <Link
                to={profilePath}
                className="truncate text-lg font-bold tracking-tight transition-colors hover:text-primary"
              >
                {member.displayName}
              </Link>
              <span className="truncate text-xs text-muted-foreground">
                ID: {member.id}
              </span>
            </div>
          </div>
          <Shield className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        </div>

        <Form
          action="/action/set-fireteam"
          method="post"
          className="flex flex-col gap-4"
        >
          <input hidden value={member.id} name="userId" readOnly />
          <input hidden value={location.pathname} name="redirect" readOnly />
          <CharacterPicker
            characters={member.characters ?? []}
            currentCharacterId={characterId}
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
        session={session}
        userId={member.id}
        characterId={characterId}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
