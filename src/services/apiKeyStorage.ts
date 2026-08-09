function getEnvOpenAiApiKey(): string | null {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0 ? key.trim() : null;
}

export function getOpenAiApiKey(): string | null {
  return getEnvOpenAiApiKey();
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
  'Add VITE_OPENAI_API_KEY to .env and run npm run build.';
