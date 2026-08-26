import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useLocalStorage } from './use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns initial value on first render', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value'),
    );
    expect(result.current[0]).toBe('default-value');
  });

  it('updates value and saves to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value'),
    );

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(window.localStorage.getItem('test-key')).toBe(
      JSON.stringify('new-value'),
    );
  });
});
