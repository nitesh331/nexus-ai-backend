import { useState, useEffect, useCallback, useRef } from 'react';

export const isChatStorageKey = (key: string): boolean => {
  return (
    key.startsWith('workspace-messages-') ||
    key.startsWith('workspace-input-') ||
    key.startsWith('companion-chat-') ||
    key === 'companion-chat-history'
  );
};

export const isTemporaryChatActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('setting-temporary-chat') === 'true';
  } catch {
    return false;
  }
};

export const getActiveStorage = (key: string): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (isTemporaryChatActive() && isChatStorageKey(key)) {
      return window.sessionStorage;
    }
    return window.localStorage;
  } catch {
    return null;
  }
};

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const storage = getActiveStorage(key);
      if (!storage) return initialValue;
      let item = storage.getItem(key);

      // In temporary mode, if not in sessionStorage yet, check localStorage as fallback for initial migration
      if (item === null && isTemporaryChatActive() && isChatStorageKey(key)) {
        item = window.localStorage.getItem(key);
        if (item !== null) {
          try {
            window.sessionStorage.setItem(key, item);
            window.localStorage.removeItem(key);
          } catch {}
        }
      }

      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading storage key "${key}":`, error);
      return initialValue;
    }
  });

  const isFirstMount = useRef(true);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = typeof value === 'function' ? (value as (val: T) => T)(prev) : value;
      try {
        if (typeof window !== 'undefined') {
          const storage = getActiveStorage(key);
          if (storage) {
            storage.setItem(key, JSON.stringify(valueToStore));
          }
          // If temporary chat is active and key is chat data, ensure it is NOT stored in localStorage
          if (isTemporaryChatActive() && isChatStorageKey(key)) {
            window.localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn(`Error setting storage key "${key}":`, error);
      }
      return valueToStore;
    });
  }, [key]);

  // Sync if another tab or window changes localStorage, or when temporary chat mode changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    const handleTempChatChanged = () => {
      if (isChatStorageKey(key)) {
        try {
          const storage = getActiveStorage(key);
          if (storage) {
            const item = storage.getItem(key);
            if (item !== null) {
              setStoredValue(JSON.parse(item));
            } else {
              setStoredValue(initialValue);
            }
          }
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('temporary-chat-changed', handleTempChatChanged);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('temporary-chat-changed', handleTempChatChanged);
    };
  }, [key, initialValue]);

  return [storedValue, setValue] as const;
}

