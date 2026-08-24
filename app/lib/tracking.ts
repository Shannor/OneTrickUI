import LogRocket from 'logrocket';

export interface UserTrackData {
  id: string;
  name?: string;
  displayName?: string;
  uniqueName?: string;
  membershipId?: string;
  primaryMembershipId?: string;
}

export function trackUserSession(user: UserTrackData | null | undefined): void {
  if (typeof window === 'undefined' || !user?.id) {
    return;
  }
  const traits: Record<string, string | number | boolean> = {};
  if (user.name) {
    traits.name = user.name;
  }
  if (user.displayName) {
    traits.displayName = user.displayName;
  }
  if (user.uniqueName) {
    traits.uniqueName = user.uniqueName;
  }
  if (user.membershipId) {
    traits.membershipId = user.membershipId;
  }
  if (user.primaryMembershipId) {
    traits.primaryMembershipId = user.primaryMembershipId;
  }
  LogRocket.identify(user.id, traits);
}
