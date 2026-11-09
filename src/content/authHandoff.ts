/**
 * Declared content script — runs ONLY on syntaxai.app (see manifest `content_scripts.matches`).
 * Receives the device token that the sign-in page posts after login and forwards it to
 * the background worker.
 */
import { SYNTAXAI_WEB_ORIGINS } from '../constants/api';
import { RUNTIME_MESSAGE } from '../types/runtimeMessages';

const AUTH_ATTR = 'data-syntaxai-auth';

let lastForwardedToken: string | null = null;

function isSyntaxAiWebOrigin(origin: string): boolean {
  return SYNTAXAI_WEB_ORIGINS.includes(origin as (typeof SYNTAXAI_WEB_ORIGINS)[number]);
}

function ackAuth(): void {
  window.postMessage(
    {
      source: 'syntaxai-extension',
      type: 'syntaxai:auth-ack',
    },
    window.location.origin,
  );
}

function forwardAuthToBackground(record: {
  token: string;
  expiresAt: string;
  userId: string;
}): void {
  if (lastForwardedToken === record.token) {
    ackAuth();
    return;
  }

  lastForwardedToken = record.token;

  void chrome.runtime
    .sendMessage({
      type: RUNTIME_MESSAGE.SYNTAXAI_AUTH,
      token: record.token,
      expiresAt: record.expiresAt,
      userId: record.userId,
    })
    .then((response: unknown) => {
      if (response && typeof response === 'object' && (response as { ok?: boolean }).ok) {
        document.documentElement.removeAttribute(AUTH_ATTR);
      }
      ackAuth();
    })
    .catch((error: unknown) => {
      lastForwardedToken = null;
      console.warn('[SyntaxAI] Auth handoff sendMessage failed', error);
    });
}

function tryConsumeDomAuth(): void {
  const raw = document.documentElement.getAttribute(AUTH_ATTR);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      parsed.source !== 'syntaxai-web' ||
      parsed.type !== 'syntaxai:auth' ||
      typeof parsed.token !== 'string' ||
      typeof parsed.expiresAt !== 'string' ||
      typeof parsed.userId !== 'string'
    ) {
      return;
    }

    forwardAuthToBackground({
      token: parsed.token,
      expiresAt: parsed.expiresAt,
      userId: parsed.userId,
    });
  } catch {
    // ignore malformed attribute
  }
}

function registerAuthHandoffListener(): void {
  window.addEventListener('message', (event: MessageEvent) => {
    if (!isSyntaxAiWebOrigin(event.origin)) {
      return;
    }

    const data: unknown = event.data;

    if (typeof data !== 'object' || data === null) {
      return;
    }

    const record = data as Record<string, unknown>;

    if (record.source !== 'syntaxai-web' || record.type !== 'syntaxai:auth') {
      return;
    }

    if (
      typeof record.token !== 'string' ||
      typeof record.expiresAt !== 'string' ||
      typeof record.userId !== 'string'
    ) {
      return;
    }

    forwardAuthToBackground({
      token: record.token,
      expiresAt: record.expiresAt,
      userId: record.userId,
    });
  });

  tryConsumeDomAuth();
  const pollId = window.setInterval(tryConsumeDomAuth, 400);
  window.setTimeout(() => window.clearInterval(pollId), 25_000);
}

registerAuthHandoffListener();
