import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
    window.matchMedia = originalMatchMedia;
  });

  function mockViewport(width: number) {
    let changeHandler: (() => void) | undefined;

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: width,
    });

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: width < 768,
      media: query,
      addEventListener: (_event: string, listener: () => void) => {
        changeHandler = listener;
      },
      removeEventListener: vi.fn(),
    }));

    return {
      resize(nextWidth: number) {
        Object.defineProperty(window, 'innerWidth', {
          configurable: true,
          writable: true,
          value: nextWidth,
        });
        changeHandler?.();
      },
    };
  }

  it('returns true below the mobile breakpoint and updates on media query change', () => {
    const viewport = mockViewport(500);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);

    act(() => {
      viewport.resize(1024);
    });

    expect(result.current).toBe(false);
  });

  it('returns false at or above the mobile breakpoint', () => {
    mockViewport(768);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});
