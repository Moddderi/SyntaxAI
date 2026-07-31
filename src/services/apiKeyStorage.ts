export const OPENAI_API_KEY_STORAGE_KEY = 'syntaxai_openai_api_key';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

export async function getOpenAiApiKey(): Promise<string | null> {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(OPENAI_API_KEY_STORAGE_KEY);
    const key = result[OPENAI_API_KEY_STORAGE_KEY];

    return typeof key === 'string' && key.trim().length > 0 ? key.trim() : null;
  }

  const key = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
  return key?.trim() ?? null;
}

export async function saveOpenAiApiKey(apiKey: string): Promise<void> {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    throw new Error('OpenAI API key cannot be empty.');
  }

  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [OPENAI_API_KEY_STORAGE_KEY]: trimmedKey });
    return;
  }

  localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmedKey);
}

export async function clearOpenAiApiKey(): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.remove(OPENAI_API_KEY_STORAGE_KEY);
    return;
  }

  localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
}

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();

  if (trimmed.length <= 8) {
    return '••••••••';
  }

  const visiblePrefix = trimmed.slice(0, Math.min(trimmed.indexOf('-') + 1, 8));
  return `${visiblePrefix}••••••••`;
}

export async function getApiKeyStatus(): Promise<'active' | 'missing'> {
  const apiKey = await getOpenAiApiKey();
  return apiKey ? 'active' : 'missing';
}
