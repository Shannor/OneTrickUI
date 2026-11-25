import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  classifyNavigationScope,
  useIsNavigating,
  useNavigationState,
} from './use-route-loaders';

const mockUseLocation = vi.fn();
const mockUseNavigation = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    useNavigation: () => mockUseNavigation(),
  };
});

describe('classifyNavigationScope', () => {
  it('returns idle when nextPathname is undefined', () => {
    expect(classifyNavigationScope('/profile/u1/c/c1/loadouts', undefined)).toBe(
      'idle',
    );
  });

  it('returns same-route when only search params or trailing slashes differ on the same pathname', () => {
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts',
        '/profile/u1/c/c1/loadouts',
      ),
    ).toBe('same-route');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts/',
        '/profile/u1/c/c1/loadouts',
      ),
    ).toBe('same-route');
    expect(classifyNavigationScope('/sessions', '/sessions')).toBe('same-route');
    expect(classifyNavigationScope('/search', '/search')).toBe('same-route');
  });

  it('returns sub-tab when switching child tabs within the same Session layout', () => {
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/sessions/sess-1',
        '/profile/u1/c/c1/sessions/sess-1/metrics',
      ),
    ).toBe('sub-tab');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/sessions/sess-1/metrics',
        '/profile/u1/c/c1/sessions/sess-1/loadouts',
      ),
    ).toBe('sub-tab');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/sessions/sess-1/loadouts',
        '/profile/u1/c/c1/sessions/sess-1',
      ),
    ).toBe('sub-tab');
  });

  it('returns sub-tab when switching child tabs within the same Loadout layout', () => {
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts/snap-1',
        '/profile/u1/c/c1/loadouts/snap-1/metrics',
      ),
    ).toBe('sub-tab');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts/snap-1/metrics',
        '/profile/u1/c/c1/loadouts/snap-1/similar',
      ),
    ).toBe('sub-tab');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts/snap-1/similar',
        '/profile/u1/c/c1/loadouts/snap-1',
      ),
    ).toBe('sub-tab');
  });

  it('returns cross-route for different entity IDs, list-to-detail transitions, and distinct routes', () => {
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/sessions/sess-1',
        '/profile/u1/c/c1/sessions/sess-2',
      ),
    ).toBe('cross-route');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts/snap-1/similar',
        '/profile/u1/c/c1/loadouts/snap-2',
      ),
    ).toBe('cross-route');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts',
        '/profile/u1/c/c1/loadouts/snap-1',
      ),
    ).toBe('cross-route');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/sessions/sess-1',
        '/profile/u1/c/c1/sessions',
      ),
    ).toBe('cross-route');
    expect(
      classifyNavigationScope(
        '/profile/u1/c/c1/loadouts',
        '/profile/u1/c/c2/loadouts',
      ),
    ).toBe('cross-route');
    expect(
      classifyNavigationScope('/sessions', '/profile/u1/c/c1/metrics'),
    ).toBe('cross-route');
  });
});

describe('useNavigationState and useIsNavigating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports idle state when navigation has no pending location', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/profile/u1/c/c1/loadouts',
      search: '',
    });
    mockUseNavigation.mockReturnValue({ state: 'idle', location: undefined });

    const { result: stateResult } = renderHook(() => useNavigationState());
    expect(stateResult.current).toEqual({
      scope: 'idle',
      isNavigating: false,
      isCrossRoute: false,
      isSameRoute: false,
      isSubTab: false,
      isScopedPending: false,
      nextLocation: undefined,
    });

    const { result: allResult } = renderHook(() => useIsNavigating());
    expect(allResult.current).toEqual([false]);
  });

  it('classifies query-param updates as same-route scoped pending rather than cross-route', () => {
    const nextLocation = {
      pathname: '/profile/u1/c/c1/loadouts',
      search: '?mode=control&page=2',
    };
    mockUseLocation.mockReturnValue({
      pathname: '/profile/u1/c/c1/loadouts',
      search: '?mode=allGameModes',
    });
    mockUseNavigation.mockReturnValue({
      state: 'loading',
      location: nextLocation,
    });

    const { result: stateResult } = renderHook(() => useNavigationState());
    expect(stateResult.current).toEqual({
      scope: 'same-route',
      isNavigating: true,
      isCrossRoute: false,
      isSameRoute: true,
      isSubTab: false,
      isScopedPending: true,
      nextLocation,
    });

    const { result: allResult } = renderHook(() => useIsNavigating());
    expect(allResult.current).toEqual([true]);

    const { result: crossOnlyResult } = renderHook(() =>
      useIsNavigating({ scope: 'cross-route' }),
    );
    expect(crossOnlyResult.current).toEqual([false]);
  });

  it('classifies Session and Loadout tab switches as sub-tab scoped pending', () => {
    const nextLocation = {
      pathname: '/profile/u1/c/c1/loadouts/snap-1/metrics',
      search: '',
    };
    mockUseLocation.mockReturnValue({
      pathname: '/profile/u1/c/c1/loadouts/snap-1',
      search: '',
    });
    mockUseNavigation.mockReturnValue({
      state: 'loading',
      location: nextLocation,
    });

    const { result: stateResult } = renderHook(() => useNavigationState());
    expect(stateResult.current.scope).toBe('sub-tab');
    expect(stateResult.current.isSubTab).toBe(true);
    expect(stateResult.current.isScopedPending).toBe(true);
    expect(stateResult.current.isCrossRoute).toBe(false);
  });

  it('classifies full route transitions as cross-route', () => {
    const nextLocation = {
      pathname: '/profile/u1/c/c1/metrics',
      search: '',
    };
    mockUseLocation.mockReturnValue({
      pathname: '/profile/u1/c/c1/loadouts',
      search: '',
    });
    mockUseNavigation.mockReturnValue({
      state: 'loading',
      location: nextLocation,
    });

    const { result: stateResult } = renderHook(() => useNavigationState());
    expect(stateResult.current.scope).toBe('cross-route');
    expect(stateResult.current.isCrossRoute).toBe(true);
    expect(stateResult.current.isScopedPending).toBe(false);

    const { result: crossOnlyResult } = renderHook(() =>
      useIsNavigating({ scope: 'cross-route' }),
    );
    expect(crossOnlyResult.current).toEqual([true]);
  });
});
