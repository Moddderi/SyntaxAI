export const SYNTAXAI_API_BASE = 'https://syntaxai.app';

export const API_BASE_URL = SYNTAXAI_API_BASE;

export const AUTH_URL = `${SYNTAXAI_API_BASE}/auth/extension`;

export const UPGRADE_URL = `${SYNTAXAI_API_BASE}/pricing`;

export const PRICING_URL = UPGRADE_URL;

export const AUTH_SIGN_IN_URL = `${SYNTAXAI_API_BASE}/auth/signin`;

/** Web handoff postMessage origin(s) — must match content script checks. */
export const SYNTAXAI_WEB_ORIGINS = [
  'https://syntaxai.app',
  'http://localhost:3000',
] as const;
