import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode, createContext, useContext } from 'react';
import {
  type ActionFunction,
  RouterProvider,
  createMemoryRouter,
} from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '~/components/ui/sonner';

import {
  buildBulkStartFormData,
  useFireteamBulkStart,
} from './use-fireteam-bulk-start';

vi.mock('~/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const SlotContext = createContext<ReactNode>(null);

function RouteSlot() {
  return <>{useContext(SlotContext)}</>;
}

function createRouterWrapper(action: ActionFunction) {
  const router = createMemoryRouter(
    [
      { path: '/', Component: RouteSlot },
      { path: '/action/start-fireteam-sessions', action },
    ],
    { initialEntries: ['/'] },
  );

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SlotContext.Provider value={children}>
        <RouterProvider router={router} />
      </SlotContext.Provider>
    );
  };
}

describe('buildBulkStartFormData', () => {
  it('serializes targets and trackComp into FormData', () => {
    const targets = [
      { userId: 'u1', characterId: 'c1' },
      { userId: 'u2', characterId: 'c2' },
    ];

    const formData = buildBulkStartFormData(targets, true);

    expect(formData.get('members')).toBe(JSON.stringify(targets));
    expect(formData.get('trackComp')).toBe('true');
    expect(formData.get('mockScenario')).toBeNull();
  });

  it('appends mockScenario when provided in dev mode', () => {
    const formData = buildBulkStartFormData(
      [{ userId: 'u1', characterId: 'c1' }],
      false,
      'mixed',
    );

    expect(formData.get('trackComp')).toBe('false');
    expect(formData.get('mockScenario')).toBe('mixed');
  });
});

describe('useFireteamBulkStart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits targets, exposes results, fires success toast, and supports dismissing results', async () => {
    const actionSpy = vi.fn(async ({ request }: { request: Request }) => {
      const formData = await request.formData();
      expect(formData.get('members')).toBe(
        JSON.stringify([{ userId: 'u1', characterId: 'c1' }]),
      );
      expect(formData.get('trackComp')).toBe('true');
      expect(formData.get('mockScenario')).toBe('race');

      return {
        ok: true,
        results: [
          {
            userId: 'u1',
            characterId: 'c1',
            outcome: 'started',
            session: {
              id: 'sess-1',
              userId: 'u1',
              characterId: 'c1',
              startedAt: new Date('2026-11-25T00:00:00Z'),
              status: 'pending',
              aggregateIds: [],
            },
          },
        ],
      };
    });

    const { result } = renderHook(() => useFireteamBulkStart('race'), {
      wrapper: createRouterWrapper(actionSpy),
    });

    expect(result.current.isBulkSubmitting).toBe(false);
    expect(result.current.visibleResults).toBeUndefined();

    act(() => {
      result.current.submitBulkStart(
        [{ userId: 'u1', characterId: 'c1' }],
        true,
      );
    });

    await waitFor(() => {
      expect(result.current.visibleResults).toHaveLength(1);
    });

    expect(result.current.bulkResults).toHaveLength(1);
    expect(result.current.errorMessage).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith('Started 1 fireteam session.');

    act(() => {
      result.current.dismissResults();
    });

    expect(result.current.visibleResults).toBeUndefined();
    expect(result.current.bulkResults).toHaveLength(1);
  });

  it('ignores empty target submissions', () => {
    const actionSpy = vi.fn(async () => ({ ok: true, results: [] }));
    const { result } = renderHook(() => useFireteamBulkStart(), {
      wrapper: createRouterWrapper(actionSpy),
    });

    act(() => {
      result.current.submitBulkStart([], false);
    });

    expect(actionSpy).not.toHaveBeenCalled();
  });

  it('exposes errorMessage and fires error toast when action returns ok: false', async () => {
    const actionSpy = vi.fn(async () => ({
      ok: false,
      error: 'Unable to start fireteam sessions',
    }));

    const { result } = renderHook(() => useFireteamBulkStart(), {
      wrapper: createRouterWrapper(actionSpy),
    });

    act(() => {
      result.current.submitBulkStart(
        [{ userId: 'u1', characterId: 'c1' }],
        false,
      );
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        'Unable to start fireteam sessions',
      );
    });

    expect(result.current.bulkResults).toBeUndefined();
    expect(result.current.visibleResults).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith(
      'Unable to start fireteam sessions',
    );
  });
});
