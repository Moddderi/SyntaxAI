/** Marketing site + OAuth / device-token (Vercel). */
export const SITE_URL = 'https://syntaxai.app';

/** Heavy API for the extension — Bearer traffic (Railway). Do not use SITE_URL here. */
export const API_BASE_URL = 'https://api.syntaxai.app';

/** @deprecated Use API_BASE_URL — kept for older imports. */
export const SYNTAXAI_API_BASE = API_BASE_URL;

/** Handoff page on the canonical marketing host (Vercel) — never www, see openAuthPage. */
export const AUTH_URL = `${SITE_URL}/auth/extension`;

export const UPGRADE_URL = `${SITE_URL}/pricing`;

export const PRICING_URL = UPGRADE_URL;

export const AUTH_SIGN_IN_URL = `${SITE_URL}/auth/signin`;

/** Web handoff postMessage origin(s) — must match content script checks. */
export const SYNTAXAI_WEB_ORIGINS = [
  'https://syntaxai.app',
  'https://www.syntaxai.app',
  'http://localhost:3000',
] as const;
