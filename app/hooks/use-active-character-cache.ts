import { log } from 'evlog';
import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function getStorageKey(userId: string) {
  return `onetrick_active_char_${userId}`;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

export function saveActiveCharacterCache(userId: string, characterId: string) {
  try {
    window.localStorage.setItem(getStorageKey(userId), characterId);
    listeners.forEach((listener) => listener());
  } catch (err) {
    log.error({
      action: 'active_character_cache.save',
      message: 'Failed to save active character in localStorage',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function useActiveCharacterCache(userId?: string | null): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!userId) return null;
      try {
        return window.localStorage.getItem(getStorageKey(userId));
      } catch (err) {
        log.error({
          action: 'active_character_cache.read',
          message: 'Failed to get active character from localStorage',
          error: err instanceof Error ? err.message : String(err),
        });
        return null;
      }
    },
    () => null,
  );
}
