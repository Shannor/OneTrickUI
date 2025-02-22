import { useEffect, useRef } from 'react';

interface UseIntervalOptions {
  immediate?: boolean; // Whether to run callback immediately when starting
  onError?: (error: unknown) => void; // Optional error handler
}

/**
 * Custom hook for managing intervals in React components
 * @param callback Function to be called on each interval
 * @param delay Delay in milliseconds. Pass null to pause the interval
 * @param options Configuration options for the interval
 * @returns Object containing control functions and status
 */
export function useInterval(
  callback: () => void | Promise<void>,
  delay: number | null,
  options: UseIntervalOptions = {},
) {
  const { immediate = false, onError } = options;
  const savedCallback = useRef(callback);
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) {
      // If delay is null, clean up interval
      if (intervalId.current) {
        clearInterval(intervalId.current);
        isRunningRef.current = false;
      }
      return;
    }

    const tick = async () => {
      try {
        await savedCallback.current();
      } catch (error) {
        onError?.(error);
      }
    };

    // Run immediately if specified
    if (immediate && !isRunningRef.current) {
      tick();
    }

    isRunningRef.current = true;
    intervalId.current = setInterval(tick, delay);

    // Cleanup on unmount or when delay changes
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        isRunningRef.current = false;
      }
    };
  }, [delay, immediate, onError]);

  // Return control functions
  return {
    stop: () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        isRunningRef.current = false;
      }
    },
    restart: () => {
      if (delay !== null && !isRunningRef.current) {
        isRunningRef.current = true;
        intervalId.current = setInterval(async () => {
          try {
            await savedCallback.current();
          } catch (error) {
            onError?.(error);
          }
        }, delay);
      }
    },
    isRunning: () => isRunningRef.current,
  };
}
