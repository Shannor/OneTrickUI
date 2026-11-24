import { log } from 'evlog';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

const storageListeners = new Set<() => void>();

function subscribe(callback: () => void) {
  storageListeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    storageListeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function emitStorageChange() {
  storageListeners.forEach((listener) => listener());
}

function parseStoredValue<T>(
  rawValue: string | null,
  initialValue: T,
  key: string,
): T {
  if (rawValue === null) {
    return initialValue;
  }
  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    log.error({
      action: 'localStorage.read',
      message: 'Error reading from localStorage',
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const rawValue = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        log.error({
          action: 'localStorage.read',
          message: 'Error reading from localStorage',
          key,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    },
    () => null,
  );

  const storedValue = useMemo<T>(
    () => parseStoredValue(rawValue, initialValue, key),
    [rawValue, initialValue, key],
  );

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        if (typeof window === 'undefined') {
          return;
        }
        const currentValue =
          value instanceof Function
            ? parseStoredValue(
                window.localStorage.getItem(key),
                initialValue,
                key,
              )
            : undefined;
        const valueToStore =
          value instanceof Function ? value(currentValue as T) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        emitStorageChange();
      } catch (error) {
        log.error({
          action: 'localStorage.write',
          message: 'Error setting localStorage value',
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [key, initialValue],
  );

  return [storedValue, setValue] as const;
}
