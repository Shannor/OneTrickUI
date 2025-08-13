import { useEffect, useRef, useState } from 'react';

interface Return {
  // Remaining time left in the countdown in Milliseconds
  remainingMs: number;
  // Will reset the timer to the original countdown or a new one.
  // Will also reset the timer if it's finished
  reset(ms?: number): void;
  // Returns the remaining time in MM:SS format
  formatted: string;
}
/**
 * useCountdown
 * A lightweight countdown hook that decrements from the provided milliseconds value down to 0.
 * It respects the `paused` flag: when `paused` is true, the remaining time will not decrement.
 *
 * Behavior:
 * - Starts from `initialMs` whenever `initialMs` changes.
 * - Decrements using requestAnimationFrame for smoothness and accuracy (time-based, not tick-based).
 * - Clamps at 0 and stops.
 * - Pausing halts decrementing without losing the remaining time; unpausing resumes from where it left off.
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useCountdown(
  initialMs: number,
  onComplete: () => void,
  options?: {
    persistKey?: string;
    paused?: boolean;
  },
): Return {
  const paused = options?.paused ?? false;
  const [restartCount, setRestartCount] = useState(0);
  // Determine initial remaining time, optionally restoring from localStorage on first render only.
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const base = Math.max(0, initialMs);
    const key = options?.persistKey;
    if (typeof window !== 'undefined' && key) {
      try {
        const raw = window.localStorage.getItem(key);
        const saved = raw != null ? Number(raw) : NaN;
        if (Number.isFinite(saved) && saved > 0) {
          // Do not exceed the configured initialMs
          return Math.min(base, saved);
        }
      } catch {
        // Ignore storage errors and fall back to base
        console.log('ignoring local storage and using default');
      }
    }
    return base;
  });

  const remainingRef = useRef<number>(Math.max(0, remainingMs));
  const pausedRef = useRef<boolean>(paused);
  const rafIdRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // Keep refs in sync with props without causing re-renders in the RAF loop
  useEffect(() => {
    pausedRef.current = paused;
    // When pausing, reset the lastTick so elapsed time doesn't accumulate during pause
    if (paused) {
      lastTickRef.current = null;
    }
  }, [paused]);

  useEffect(() => {
    function tick(now: number) {
      if (pausedRef.current) {
        // While paused, don't advance; just request the next frame and keep waiting
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      // Establish baseline for measuring elapsed time
      if (lastTickRef.current == null) {
        lastTickRef.current = now;
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      if (remainingRef.current <= 0) {
        // Already complete; no need to keep scheduling frames
        if (rafIdRef.current != null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        return;
      }

      const nextRemaining = Math.max(0, remainingRef.current - elapsed);
      remainingRef.current = nextRemaining;

      // Only update state if it actually changed to avoid unnecessary renders
      setRemainingMs((prev) => (prev !== nextRemaining ? nextRemaining : prev));

      // Persist the latest remaining time if a key is provided
      const key = options?.persistKey;
      if (typeof window !== 'undefined' && key) {
        try {
          if (nextRemaining > 0) {
            window.localStorage.setItem(key, String(Math.ceil(nextRemaining)));
          } else {
            window.localStorage.removeItem(key);
          }
        } catch {
          // Ignore storage errors
        }
      }

      if (nextRemaining > 0) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        // Completed; stop scheduling
        onComplete();
        if (rafIdRef.current != null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      }
    }

    // Start the loop
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTickRef.current = null;
    };
  }, [restartCount]);

  function reset(ms?: number) {
    const next = Math.max(0, ms ?? initialMs);
    remainingRef.current = next;
    setRemainingMs(next);
    // When resetting, also reset tick anchor so we don't subtract an old elapsed value
    lastTickRef.current = null;
    if (rafIdRef.current === null) {
      setRestartCount((val) => ++val);
    }
  }

  return { remainingMs, reset, formatted: formatTime(remainingMs) };
}
