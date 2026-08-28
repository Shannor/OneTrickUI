import { describe, expect, it, vi } from 'vitest';

import { handleBackNavigation } from './navigation';

describe('handleBackNavigation', () => {
  it('calls navigate(-1) when history stack idx > 0', () => {
    const navigate = vi.fn();
    vi.stubGlobal('window', {
      history: { state: { idx: 2 } },
    });

    handleBackNavigation(navigate, '/sessions', {});
    expect(navigate).toHaveBeenCalledWith(-1);

    vi.unstubAllGlobals();
  });

  it('navigates to character overview fallback when landing directly on a deep route without history', () => {
    const navigate = vi.fn();
    vi.stubGlobal('window', {
      history: { state: { idx: 0 } },
    });

    handleBackNavigation(
      navigate,
      '/profile/user-1/c/char-1/activities/act-1',
      {
        id: 'user-1',
        characterId: 'char-1',
      },
    );
    expect(navigate).toHaveBeenCalledWith('/profile/user-1/c/char-1');

    vi.unstubAllGlobals();
  });

  it('navigates to root fallback when landing directly on character overview without history', () => {
    const navigate = vi.fn();
    vi.stubGlobal('window', {
      history: { state: { idx: 0 } },
    });

    handleBackNavigation(navigate, '/profile/user-1/c/char-1', {
      id: 'user-1',
      characterId: 'char-1',
    });
    expect(navigate).toHaveBeenCalledWith('/');

    vi.unstubAllGlobals();
  });

  it('navigates to root fallback when no params exist and landing directly without history', () => {
    const navigate = vi.fn();
    vi.stubGlobal('window', {
      history: { state: { idx: 0 } },
    });

    handleBackNavigation(navigate, '/sessions', {});
    expect(navigate).toHaveBeenCalledWith('/');

    vi.unstubAllGlobals();
  });
});
