import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';
import { getStorage, setStorage } from './storage';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// A custom hook for persistent storage using Capacitor Preferences
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadStoredValue() {
      try {
        const item = await getStorage(key);
        if (item !== null) {
          setStoredValue(item);
        }
      } catch (error) {
        console.warn(`Error reading storage key "${key}":`, error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredValue();
  }, [key]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await setStorage(key, valueToStore);
    } catch (error) {
      console.warn(`Error setting storage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}
