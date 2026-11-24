import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSimilarSnapshots } from '~/api';

import {
  getCachedSimilarSnapshots,
  requestTargetsSimilarRoute,
} from './snapshots';

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getSimilarSnapshots: vi.fn(),
  };
});

describe('snapshots server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestTargetsSimilarRoute', () => {
    it('matches /similar, /similar/, and /similar.data routes', () => {
      expect(
        requestTargetsSimilarRoute(
          new Request(
            'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar',
          ),
        ),
      ).toBe(true);
      expect(
        requestTargetsSimilarRoute(
          new Request(
            'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar/',
          ),
        ),
      ).toBe(true);
      expect(
        requestTargetsSimilarRoute(
          new Request(
            'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar.data',
          ),
        ),
      ).toBe(true);
    });

    it('returns false for non-similar loadout routes and invalid URLs', () => {
      expect(
        requestTargetsSimilarRoute(
          new Request('http://localhost/profile/u1/c/c1/loadouts/snap-1'),
        ),
      ).toBe(false);
      expect(
        requestTargetsSimilarRoute(
          new Request(
            'http://localhost/profile/u1/c/c1/loadouts/snap-1/metrics',
          ),
        ),
      ).toBe(false);
      expect(
        requestTargetsSimilarRoute(
          new Request(
            'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar/extra',
          ),
        ),
      ).toBe(false);
      expect(
        requestTargetsSimilarRoute({ url: 'not-a-valid-url' } as Request),
      ).toBe(false);
    });
  });

  describe('getCachedSimilarSnapshots', () => {
    it('explicitly sends includeStats: false for non-similar routes when options.includeStats is omitted or false', async () => {
      vi.mocked(getSimilarSnapshots).mockResolvedValue({
        data: { target: { id: 'snap-1' }, items: [] },
        error: undefined,
      } as any);

      const reqDefault = new Request(
        'http://localhost/profile/u1/c/c1/loadouts/snap-1',
      );
      await getCachedSimilarSnapshots(reqDefault, 'snap-1');

      expect(getSimilarSnapshots).toHaveBeenCalledWith({
        path: { snapshotId: 'snap-1' },
        query: { includeStats: false },
      });

      const reqExplicitFalse = new Request(
        'http://localhost/profile/u1/c/c1/loadouts/snap-1/metrics',
      );
      await getCachedSimilarSnapshots(reqExplicitFalse, 'snap-1', {
        includeStats: false,
      });

      expect(getSimilarSnapshots).toHaveBeenLastCalledWith({
        path: { snapshotId: 'snap-1' },
        query: { includeStats: false },
      });
    });

    it('explicitly sends includeStats: true when requested via options', async () => {
      vi.mocked(getSimilarSnapshots).mockResolvedValueOnce({
        data: { target: { id: 'snap-1' }, items: [] },
        error: undefined,
      } as any);

      const req = new Request(
        'http://localhost/profile/u1/c/c1/loadouts/snap-1',
      );
      await getCachedSimilarSnapshots(req, 'snap-1', { includeStats: true });

      expect(getSimilarSnapshots).toHaveBeenCalledWith({
        path: { snapshotId: 'snap-1' },
        query: { includeStats: true },
      });
    });

    it('upgrades includeStats to true when the request targets /similar or /similar.data', async () => {
      vi.mocked(getSimilarSnapshots).mockResolvedValue({
        data: { target: { id: 'snap-1' }, items: [] },
        error: undefined,
      } as any);

      const similarReq = new Request(
        'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar',
      );
      await getCachedSimilarSnapshots(similarReq, 'snap-1');

      expect(getSimilarSnapshots).toHaveBeenCalledWith({
        path: { snapshotId: 'snap-1' },
        query: { includeStats: true },
      });

      const similarDataReq = new Request(
        'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar.data',
      );
      await getCachedSimilarSnapshots(similarDataReq, 'snap-1', {
        includeStats: false,
      });

      expect(getSimilarSnapshots).toHaveBeenLastCalledWith({
        path: { snapshotId: 'snap-1' },
        query: { includeStats: true },
      });
    });

    it('deduplicates calls within the same Request and isolates separate Requests', async () => {
      vi.mocked(getSimilarSnapshots).mockImplementation(
        () =>
          Promise.resolve({
            data: { target: { id: 'snap-1' }, items: [] },
            error: undefined,
          }) as any,
      );

      const req1 = new Request(
        'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar',
      );
      const p1 = getCachedSimilarSnapshots(req1, 'snap-1');
      const p2 = getCachedSimilarSnapshots(req1, 'snap-1', {
        includeStats: true,
      });

      expect(p1).toBe(p2);
      await Promise.all([p1, p2]);
      expect(getSimilarSnapshots).toHaveBeenCalledTimes(1);

      const req2 = new Request(
        'http://localhost/profile/u1/c/c1/loadouts/snap-1/similar',
      );
      const p3 = getCachedSimilarSnapshots(req2, 'snap-1');

      expect(p3).not.toBe(p1);
      await p3;
      expect(getSimilarSnapshots).toHaveBeenCalledTimes(2);
    });

    it('passes explicit query.includeStats when request is undefined', async () => {
      vi.mocked(getSimilarSnapshots).mockResolvedValue({
        data: { target: { id: 'snap-1' }, items: [] },
        error: undefined,
      } as any);

      await getCachedSimilarSnapshots(undefined, 'snap-1');
      expect(getSimilarSnapshots).toHaveBeenCalledWith({
        path: { snapshotId: 'snap-1' },
        query: { includeStats: false },
      });

      await getCachedSimilarSnapshots(undefined, 'snap-1', {
        includeStats: true,
      });
      expect(getSimilarSnapshots).toHaveBeenLastCalledWith({
        path: { snapshotId: 'snap-1' },
        query: { includeStats: true },
      });
    });
  });
});
