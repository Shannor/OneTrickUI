import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamMemberView } from '~/lib/fireteam-sessions';

import {
  FireteamMemberProvider,
  useFireteamMember,
} from './fireteam-member-context';

const sampleView: FireteamMemberView = {
  member: {
    id: 'u1',
    membershipId: 'm1',
    displayName: 'Alpha',
    characters: [],
  },
  memberKey: 'u1',
  savedCharId: 'c1',
  effectiveCharId: 'c1',
  activeSessions: [],
  isSelectedCharActive: false,
  hasAnyActive: false,
  isReadyToStart: true,
  isSelectedForBulk: true,
};

function MemberConsumer() {
  const { member, effectiveCharId } = useFireteamMember();
  return (
    <span data-testid="member-info">
      {member.displayName}:{effectiveCharId}
    </span>
  );
}

describe('FireteamMemberContext', () => {
  it('provides the FireteamMemberView to consumers', () => {
    render(
      <FireteamMemberProvider view={sampleView}>
        <MemberConsumer />
      </FireteamMemberProvider>,
    );

    expect(screen.getByTestId('member-info')).toHaveTextContent('Alpha:c1');
  });

  it('throws when useFireteamMember is called outside FireteamMemberProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<MemberConsumer />)).toThrow(
      'useFireteamMember must be used within a FireteamMemberProvider',
    );
    spy.mockRestore();
  });
});
