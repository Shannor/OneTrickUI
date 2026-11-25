import LogRocket from 'logrocket';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initTracking, trackError, trackUserSession } from './tracking';

vi.mock('logrocket', () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    track: vi.fn(),
    captureException: vi.fn(),
  },
}));

describe('initTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lazily loads and initializes LogRocket in the browser', async () => {
    await initTracking();
    expect(LogRocket.init).toHaveBeenCalledWith('gruntt/d2-one-trick');
  });
});

describe('trackUserSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing if user is null or undefined', async () => {
    await trackUserSession(null);
    await trackUserSession(undefined);
    expect(LogRocket.identify).not.toHaveBeenCalled();
  });

  it('identifies user with LogRocket including name and profile traits when provided', async () => {
    await trackUserSession({
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

  it('omits undefined traits when calling LogRocket.identify', async () => {
    await trackUserSession({
      id: 'user-456',
    });

    expect(LogRocket.identify).toHaveBeenCalledWith('user-456', {});
  });
});

describe('trackError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks 404 event and captures exception with LogRocket', async () => {
    const error404 = { status: 404 };
    await trackError(error404);

    expect(LogRocket.track).toHaveBeenCalledWith(
      '404_page_not_found',
      expect.objectContaining({
        pathname: expect.any(String),
      }),
    );
    expect(LogRocket.captureException).toHaveBeenCalled();
  });
});
