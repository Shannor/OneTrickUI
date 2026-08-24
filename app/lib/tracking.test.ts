import LogRocket from 'logrocket';
import { describe, expect, it, vi } from 'vitest';

import { trackUserSession } from './tracking';

vi.mock('logrocket', () => ({
  default: {
    identify: vi.fn(),
  },
}));

describe('trackUserSession', () => {
  it('does nothing if user is null or undefined', () => {
    trackUserSession(null);
    trackUserSession(undefined);
    expect(LogRocket.identify).not.toHaveBeenCalled();
  });

  it('identifies user with LogRocket including name and profile traits when provided', () => {
    trackUserSession({
      id: 'user-123',
      name: 'Guardian#1234',
      displayName: 'Guardian#1234',
      uniqueName: 'Guardian#1234',
      membershipId: 'mem-456',
      primaryMembershipId: 'prim-789',
    });

    expect(LogRocket.identify).toHaveBeenCalledWith('user-123', {
      name: 'Guardian#1234',
      displayName: 'Guardian#1234',
      uniqueName: 'Guardian#1234',
      membershipId: 'mem-456',
      primaryMembershipId: 'prim-789',
    });
  });

  it('omits undefined traits when calling LogRocket.identify', () => {
    trackUserSession({
      id: 'user-456',
    });

    expect(LogRocket.identify).toHaveBeenCalledWith('user-456', {});
  });
});
