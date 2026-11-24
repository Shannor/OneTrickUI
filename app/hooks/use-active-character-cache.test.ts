import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  saveActiveCharacterCache,
  useActiveCharacterCache,
} from './use-active-character-cache';

describe('useActiveCharacterCache', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when userId is missing or nothing is stored', () => {
    const { result: noUser } = renderHook(() =>
      useActiveCharacterCache(undefined),
    );
    expect(noUser.current).toBeNull();

    const { result: empty } = renderHook(() =>
      useActiveCharacterCache('user-1'),
    );
    expect(empty.current).toBeNull();
  });

  it('reads cached character id and updates subscribers when saved', () => {
    const { result } = renderHook(() => useActiveCharacterCache('user-1'));
    expect(result.current).toBeNull();

    act(() => {
      saveActiveCharacterCache('user-1', 'char-42');
    });

    expect(result.current).toBe('char-42');
    expect(window.localStorage.getItem('onetrick_active_char_user-1')).toBe(
      'char-42',
    );
  });
});
