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

  const storedValue = useMemo<T>(() => {
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
  }, [rawValue, initialValue, key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          emitStorageChange();
        }
      } catch (error) {
        log.error({
          action: 'localStorage.write',
          message: 'Error setting localStorage value',
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue] as const;
}
