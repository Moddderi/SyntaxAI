import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  getTheme,
  saveTheme,
  THEME_CHANGED_EVENT,
  type ThemeMode,
} from '../storage/themeStorage';

export function useTheme(): {
  theme: ThemeMode;
  isLight: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
} {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    let isMounted = true;

    void getTheme().then((storedTheme) => {
      if (!isMounted) {
        return;
      }

      applyTheme(storedTheme);
      setThemeState(storedTheme);
    });

    const handleThemeChanged = (event: Event): void => {
      const customEvent = event as CustomEvent<ThemeMode>;
      const nextTheme = customEvent.detail ?? 'dark';
      applyTheme(nextTheme);
      setThemeState(nextTheme);
    };

    window.addEventListener(THEME_CHANGED_EVENT, handleThemeChanged);

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const handleStorageChange = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ): void => {
        if (areaName !== 'local' || !changes.syntaxai_theme) {
          return;
        }

        const nextTheme = changes.syntaxai_theme.newValue === 'light' ? 'light' : 'dark';
        applyTheme(nextTheme);
        setThemeState(nextTheme);
      };

      chrome.storage.onChanged.addListener(handleStorageChange);

      return () => {
        isMounted = false;
        window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChanged);
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }

    return () => {
      isMounted = false;
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChanged);
    };
  }, []);

  const setTheme = useCallback(async (nextTheme: ThemeMode): Promise<void> => {
    await saveTheme(nextTheme);
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(async (): Promise<void> => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(nextTheme);
  }, [setTheme, theme]);

  return {
    theme,
    isLight: theme === 'light',
    setTheme,
    toggleTheme,
  };
}
