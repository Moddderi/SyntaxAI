import { apiFetchAuthed } from './apiClient';
import { setBillingLimitsEnforced } from './billingState';
import {
  clearAuthCredentials,
  getDeviceToken,
  getSessionCache,
  saveSessionCache,
} from '../storage/authStorage';
import type { SyntaxAiSessionResponse } from '../types/api';

export async function hydrateBillingFromSessionCache(): Promise<SyntaxAiSessionResponse | null> {
  const cached = await getSessionCache();

  if (cached) {
    setBillingLimitsEnforced(cached.billing.enabled);
  }

  return cached;
}

export async function fetchSession(): Promise<SyntaxAiSessionResponse | null> {
  const token = await getDeviceToken();

  if (!token) {
    setBillingLimitsEnforced(false);
    return null;
  }

  const response = await apiFetchAuthed('/api/v1/session');

  if (response.status === 401) {
    await clearAuthCredentials();
    setBillingLimitsEnforced(false);
    return null;
  }

  if (!response.ok) {
    throw new Error(`Session request failed (${response.status})`);
  }

  const session = (await response.json()) as SyntaxAiSessionResponse;
  await saveSessionCache(session);
  setBillingLimitsEnforced(session.billing.enabled);
  return session;
}

export async function refreshSession(): Promise<SyntaxAiSessionResponse | null> {
  try {
    return await fetchSession();
  } catch {
    const cached = await getSessionCache();
    return cached;
  }
}
