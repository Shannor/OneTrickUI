import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHydrated } from './use-hydrated';

describe('useHydrated', () => {
  it('returns true after mounting on the client', () => {
    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });
});
