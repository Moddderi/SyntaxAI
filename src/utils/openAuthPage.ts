import { AUTH_URL } from '../constants/api';

export function openAuthPage(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url: AUTH_URL });
    return;
  }

  window.open(AUTH_URL, '_blank', 'noopener,noreferrer');
}
