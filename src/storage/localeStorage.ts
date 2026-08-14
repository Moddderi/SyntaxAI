export type Locale = 'en' | 'uk';

export const LOCALE_STORAGE_KEY = 'syntaxai_locale';

export const LOCALE_CHANGED_EVENT = 'syntaxai-locale-changed';

const DEFAULT_LOCALE: Locale = 'en';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function normalizeLocale(value: unknown): Locale {
  return value === 'uk' ? 'uk' : 'en';
}

export function applyLocale(locale: Locale): void {
  document.documentElement.lang = locale;
}

export function notifyLocaleChanged(locale: Locale): void {
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: locale }));
}

export async function getLocale(): Promise<Locale> {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
    return normalizeLocale(result[LOCALE_STORAGE_KEY]);
  }

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored ? normalizeLocale(stored) : DEFAULT_LOCALE;
}

export async function saveLocale(locale: Locale): Promise<void> {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);

  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: locale });
    notifyLocaleChanged(locale);
    return;
  }

  notifyLocaleChanged(locale);
}

export function readCachedLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored ? normalizeLocale(stored) : DEFAULT_LOCALE;
}
