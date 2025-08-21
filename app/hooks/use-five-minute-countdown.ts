import { useCallback, useMemo, useRef } from 'react';
import { useCountdown } from './use-countdown';

interface Return {
  // Remaining time left in the countdown in Milliseconds
  remainingMs: number;
  // Will reset the timer to the next 5-minute boundary from "now".
  reset(): void;
  // Returns the remaining time in MM:SS format
  formatted: string;
}

/**
 * Computes milliseconds until the NEXT 5-minute boundary from a given timestamp (local time).
 * Example: 09:57:12.xxx -> milliseconds until 10:00:00.000
 */
function msUntilNextFiveMinuteBoundary(nowMs: number = Date.now()): number {
  const now = new Date(nowMs);
  const minutes = now.getMinutes();
  const remainder = minutes % 5;
  const base = new Date(now);
  base.setSeconds(0, 0);

  // Previous 5-min mark = minutes - remainder; next boundary = +5 minutes from that base.
  base.setMinutes(minutes - remainder);
  const next = new Date(base.getTime() + 5 * 60 * 1000);
  const diff = next.getTime() - nowMs;

  // If we're exactly on the boundary (diff === 0), move to the following boundary (5 minutes ahead)
  return diff > 0 ? diff : 5 * 60 * 1000;
}

/**
 * useFiveMinuteCountdown
 * A countdown that always targets the next 5-minute interval. When it reaches a boundary,
 * it automatically resets to the subsequent 5-minute boundary and continues.
 *
 * API mirrors useCountdown's return shape for easy drop-in usage.
 */
export function useFiveMinuteCountdown(
  onBoundary?: () => void,
  options?: {
    paused?: boolean;
  },
): Return {
  const computeMs = useCallback(() => msUntilNextFiveMinuteBoundary(Date.now()), []);

  // We use a ref to hold the latest reset function so the complete-callback can restart the timer seamlessly.
  const resetRef = useRef<(ms?: number) => void>(undefined);

  const { remainingMs, formatted, reset } = useCountdown(
    // initial ms until the next boundary
    computeMs(),
    () => {
      // Notify consumer first
      onBoundary?.();
      // Then immediately schedule countdown to the subsequent boundary
      const nextMs = computeMs();
      resetRef.current?.(nextMs);
    },
    { paused: options?.paused },
  );

  // Keep the ref updated each render
  resetRef.current = reset;

  // Public reset always snaps to the next boundary from "now"
  const publicReset = useMemo(() => {
    return () => {
      const nextMs = computeMs();
      reset(nextMs);
    };
  }, [computeMs, reset]);

  return { remainingMs, formatted, reset: publicReset };
}
