import { AUTH_URL } from '../constants/api';

/**
 * Must stay on the canonical host (no www): OAuth state cookies are host-scoped and the
 * provider callback lands on SITE_URL, so starting on www fails with `state_mismatch`.
 */
export const AUTH_HANDOFF_URL = AUTH_URL;

export function openAuthPage(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url: AUTH_HANDOFF_URL });
    return;
  }

  window.open(AUTH_HANDOFF_URL, '_blank', 'noopener,noreferrer');
}
