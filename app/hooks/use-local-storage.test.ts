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

  it('reads existing values from localStorage', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value'),
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('supports consecutive functional updates in the same tick', () => {
    const { result } = renderHook(() => useLocalStorage('count-key', 1));
    const initialSetValue = result.current[1];

    act(() => {
      result.current[1]((prev) => prev + 1);
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(3);
    expect(window.localStorage.getItem('count-key')).toBe('3');
    expect(result.current[1]).toBe(initialSetValue);
  });
});
