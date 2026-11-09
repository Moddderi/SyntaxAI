import { AUTH_URL } from '../constants/api';

/** Prefer www — matches production primary domain and auth handoff origins. */
export const AUTH_HANDOFF_URL = AUTH_URL.includes('://syntaxai.app/')
  ? AUTH_URL.replace('://syntaxai.app/', '://www.syntaxai.app/')
  : AUTH_URL;

export function openAuthPage(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url: AUTH_HANDOFF_URL });
    return;
  }

  window.open(AUTH_HANDOFF_URL, '_blank', 'noopener,noreferrer');
}
