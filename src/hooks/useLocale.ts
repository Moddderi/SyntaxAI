import { useCallback, useEffect, useState } from 'react';
import {
  applyLocale,
  getLocale,
  LOCALE_CHANGED_EVENT,
  LOCALE_STORAGE_KEY,
  readCachedLocale,
  saveLocale,
  type Locale,
} from '../storage/localeStorage';

export function useLocale(): {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
} {
  const [locale, setLocaleState] = useState<Locale>(() => readCachedLocale());

  useEffect(() => {
    let isMounted = true;

    void getLocale().then((storedLocale) => {
      if (!isMounted) {
        return;
      }

      applyLocale(storedLocale);
      setLocaleState(storedLocale);
    });

    const handleLocaleChanged = (event: Event): void => {
      const customEvent = event as CustomEvent<Locale>;
      const nextLocale = customEvent.detail ?? 'en';
      applyLocale(nextLocale);
      setLocaleState(nextLocale);
    };

    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const handleStorageChange = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ): void => {
        if (areaName !== 'local' || !changes[LOCALE_STORAGE_KEY]) {
          return;
        }

        const nextLocale = changes[LOCALE_STORAGE_KEY].newValue === 'uk' ? 'uk' : 'en';
        applyLocale(nextLocale);
        setLocaleState(nextLocale);
      };

      chrome.storage.onChanged.addListener(handleStorageChange);

      return () => {
        isMounted = false;
        window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }

    return () => {
      isMounted = false;
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale): Promise<void> => {
    await saveLocale(nextLocale);
    applyLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  return { locale, setLocale };
}
