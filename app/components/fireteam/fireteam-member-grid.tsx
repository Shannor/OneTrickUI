import { FireteamMemberProvider, useFireteam } from './fireteam-context';
import {
  FireteamMemberCard,
  MemberCardHeader,
  MemberCharacterForm,
} from './fireteam-member-card';
import { MemberSessionStatus } from './member-session-status';

export function FireteamMemberGrid() {
  const { memberViews } = useFireteam();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      {memberViews.map((view) => (
        <FireteamMemberProvider
          key={view.member.membershipId || view.member.id}
          view={view}
        >
          <FireteamMemberCard>
            <div className="flex flex-col gap-4">
              <MemberCardHeader />
              <MemberCharacterForm />
            </div>
            <MemberSessionStatus />
          </FireteamMemberCard>
        </FireteamMemberProvider>
      ))}
    </div>
  );
}
