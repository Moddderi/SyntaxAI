import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  applyLocale,
  getLocale,
  LOCALE_CHANGED_EVENT,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  readCachedLocale,
  saveLocale,
  seedLocaleCache,
  type Locale,
} from '../storage/localeStorage';

interface LocaleContextValue {
  locale: Locale;
  isReady: boolean;
  setLocale: (locale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }): ReactElement {
  const [locale, setLocaleState] = useState<Locale>(() => readCachedLocale());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getLocale().then((storedLocale) => {
      if (!isMounted) {
        return;
      }

      seedLocaleCache(storedLocale);
      applyLocale(storedLocale);
      setLocaleState(storedLocale);
      setIsReady(true);
    });

    const handleLocaleChanged = (event: Event): void => {
      const customEvent = event as CustomEvent<Locale>;
      const nextLocale = normalizeLocale(customEvent.detail);
      seedLocaleCache(nextLocale);
      applyLocale(nextLocale);
      setLocaleState(nextLocale);
    };

    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== 'local' || !changes[LOCALE_STORAGE_KEY]) {
        return;
      }

      const nextLocale = normalizeLocale(changes[LOCALE_STORAGE_KEY].newValue);
      seedLocaleCache(nextLocale);
      applyLocale(nextLocale);
      setLocaleState(nextLocale);
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      isMounted = false;
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale): Promise<void> => {
    await saveLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      isReady,
      setLocale,
    }),
    [isReady, locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }

  return context;
}
