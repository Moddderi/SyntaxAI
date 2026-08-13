export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'syntaxai_theme';

export const THEME_CHANGED_EVENT = 'syntaxai-theme-changed';

const DEFAULT_THEME: ThemeMode = 'dark';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function normalizeTheme(value: unknown): ThemeMode {
  return value === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
}

export function notifyThemeChanged(theme: ThemeMode): void {
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: theme }));
}

export async function getTheme(): Promise<ThemeMode> {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
    return normalizeTheme(result[THEME_STORAGE_KEY]);
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored ? normalizeTheme(stored) : DEFAULT_THEME;
}

export async function saveTheme(theme: ThemeMode): Promise<void> {
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
    notifyThemeChanged(theme);
    return;
  }

  notifyThemeChanged(theme);
}

export function readCachedTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored ? normalizeTheme(stored) : DEFAULT_THEME;
}
