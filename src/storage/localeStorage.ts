export type Locale = 'en' | 'uk';

export const LOCALE_STORAGE_KEY = 'syntaxai_locale';

export const LOCALE_CHANGED_EVENT = 'syntaxai-locale-changed';

const DEFAULT_LOCALE: Locale = 'en';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

export function normalizeLocale(value: unknown): Locale {
  return value === 'uk' ? 'uk' : 'en';
}

/** First visit: prefer Ukrainian when the browser language is uk*. */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  for (const candidate of candidates) {
    if (/^uk\b/i.test(candidate)) {
      return 'uk';
    }
  }

  return DEFAULT_LOCALE;
}

export function seedLocaleCache(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // private mode / quota — ignore
  }
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
    const raw = result[LOCALE_STORAGE_KEY];

    if (raw === undefined || raw === null || raw === '') {
      const detected = detectBrowserLocale();
      seedLocaleCache(detected);
      await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: detected });
      return detected;
    }

    const locale = normalizeLocale(raw);
    seedLocaleCache(locale);
    return locale;
  }

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);

  if (!stored) {
    const detected = detectBrowserLocale();
    seedLocaleCache(detected);
    return detected;
  }

  return normalizeLocale(stored);
}

export async function saveLocale(locale: Locale): Promise<void> {
  seedLocaleCache(locale);
  applyLocale(locale);

  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: locale });
  }

  notifyLocaleChanged(locale);
}

export function readCachedLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored ? normalizeLocale(stored) : DEFAULT_LOCALE;
}
