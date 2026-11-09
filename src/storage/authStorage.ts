import {
  DEVICE_TOKEN_STORAGE_KEY,
  SESSION_CACHE_STORAGE_KEY,
  TOKEN_EXPIRES_AT_STORAGE_KEY,
  USER_ID_STORAGE_KEY,
} from '../constants/storageKeys';
import type { SyntaxAiSessionResponse } from '../types/api';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

export interface AuthCredentials {
  token: string;
  expiresAt: string;
  userId: string;
}

export async function saveAuthCredentials(credentials: AuthCredentials): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  await chrome.storage.local.set({
    [DEVICE_TOKEN_STORAGE_KEY]: credentials.token,
    [TOKEN_EXPIRES_AT_STORAGE_KEY]: credentials.expiresAt,
    [USER_ID_STORAGE_KEY]: credentials.userId,
  });
}

export async function clearAuthCredentials(): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  await chrome.storage.local.remove([
    DEVICE_TOKEN_STORAGE_KEY,
    TOKEN_EXPIRES_AT_STORAGE_KEY,
    USER_ID_STORAGE_KEY,
    SESSION_CACHE_STORAGE_KEY,
  ]);
}

export async function getDeviceToken(): Promise<string | null> {
  if (!isChromeStorageAvailable()) {
    return null;
  }

  const result = await chrome.storage.local.get(DEVICE_TOKEN_STORAGE_KEY);
  const token = result[DEVICE_TOKEN_STORAGE_KEY];

  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : null;
}

export async function hasAuthCredentials(): Promise<boolean> {
  const token = await getDeviceToken();
  return token !== null;
}

export async function saveSessionCache(session: SyntaxAiSessionResponse): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  // Skip identical writes — each set() fires storage.onChanged and used to re-trigger refresh.
  const existing = await getSessionCache();

  if (
    existing &&
    existing.user.id === session.user.id &&
    existing.user.email === session.user.email &&
    existing.user.name === session.user.name &&
    existing.user.plan === session.user.plan &&
    existing.billing.enabled === session.billing.enabled &&
    existing.sync.notesPath === session.sync.notesPath &&
    existing.sync.strategy === session.sync.strategy
  ) {
    return;
  }

  await chrome.storage.local.set({
    [SESSION_CACHE_STORAGE_KEY]: session,
  });
}

export async function getSessionCache(): Promise<SyntaxAiSessionResponse | null> {
  if (!isChromeStorageAvailable()) {
    return null;
  }

  const result = await chrome.storage.local.get(SESSION_CACHE_STORAGE_KEY);
  const raw = result[SESSION_CACHE_STORAGE_KEY];

  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const user = record.user;

  if (typeof user !== 'object' || user === null) {
    return null;
  }

  const userRecord = user as Record<string, unknown>;

  if (
    typeof userRecord.id !== 'string' ||
    typeof userRecord.email !== 'string' ||
    typeof userRecord.plan !== 'string'
  ) {
    return null;
  }

  const billing = record.billing;
  const sync = record.sync;

  if (typeof billing !== 'object' || billing === null || typeof sync !== 'object' || sync === null) {
    return null;
  }

  const billingRecord = billing as Record<string, unknown>;
  const syncRecord = sync as Record<string, unknown>;

  if (
    typeof billingRecord.enabled !== 'boolean' ||
    typeof syncRecord.notesPath !== 'string' ||
    typeof syncRecord.strategy !== 'string'
  ) {
    return null;
  }

  return {
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: typeof userRecord.name === 'string' ? userRecord.name : null,
      plan: userRecord.plan,
    },
    billing: {
      enabled: billingRecord.enabled,
      limits: billingRecord.limits ?? null,
    },
    sync: {
      notesPath: syncRecord.notesPath,
      strategy: syncRecord.strategy,
    },
  };
}
