export const OPENAI_API_KEY_STORAGE_KEY = 'syntaxai_openai_api_key';

let cachedStoredKey: string | null = null;
let hydrationPromise: Promise<void> | null = null;

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function getDevEnvOpenAiApiKey(): string | null {
  if (!import.meta.env.DEV) {
    return null;
  }

  const key = import.meta.env.VITE_OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0 ? key.trim() : null;
}

export async function loadOpenAiApiKeyFromStorage(): Promise<string | null> {
  if (!isChromeStorageAvailable()) {
    cachedStoredKey = null;
    return null;
  }

  const raw = await chrome.storage.local.get(OPENAI_API_KEY_STORAGE_KEY);
  const value = raw[OPENAI_API_KEY_STORAGE_KEY];
  cachedStoredKey =
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  return cachedStoredKey;
}

export function ensureOpenAiApiKeyLoaded(): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = loadOpenAiApiKeyFromStorage().then(() => undefined);
  }
  return hydrationPromise;
}

export async function saveOpenAiApiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();

  if (!isChromeStorageAvailable()) {
    cachedStoredKey = trimmed.length > 0 ? trimmed : null;
    return;
  }

  if (trimmed.length === 0) {
    await chrome.storage.local.remove(OPENAI_API_KEY_STORAGE_KEY);
    cachedStoredKey = null;
    return;
  }

  await chrome.storage.local.set({ [OPENAI_API_KEY_STORAGE_KEY]: trimmed });
  cachedStoredKey = trimmed;
}

export function getOpenAiApiKey(): string | null {
  const devKey = getDevEnvOpenAiApiKey();
  if (devKey) {
    return devKey;
  }

  return cachedStoredKey;
}

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();

  if (trimmed.length <= 8) {
    return '••••••••';
  }

  const visiblePrefix = trimmed.slice(0, Math.min(trimmed.indexOf('-') + 1, 8));
  return `${visiblePrefix}••••••••`;
}

export function getApiKeyStatus(): 'active' | 'missing' {
  return getOpenAiApiKey() ? 'active' : 'missing';
}

export const OPENAI_API_KEY_ENV_HINT =
  'Add your OpenAI API key in Settings (stored locally in the browser). For local dev you can use VITE_OPENAI_API_KEY in .env with npm run dev.';
