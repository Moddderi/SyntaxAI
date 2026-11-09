import { SITE_URL } from '../constants/api';
import { handleAuthPayloadFromTab } from './authCoordinator';

const AUTH_PATH = '/auth/extension';
const AUTH_ATTR = 'data-syntaxai-auth';
const POLL_MS = 500;
const POLL_FOR_MS = 45_000;

const watchedTabs = new Map<number, number>();

function isAuthExtensionUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const hostOk =
      parsed.hostname === 'syntaxai.app' ||
      parsed.hostname === 'www.syntaxai.app' ||
      parsed.hostname === 'localhost';
    return hostOk && parsed.pathname.startsWith(AUTH_PATH);
  } catch {
    return false;
  }
}

async function readAuthAttribute(tabId: number): Promise<string | null> {
  if (!chrome.scripting?.executeScript) {
    return null;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (attrName: string) => document.documentElement.getAttribute(attrName),
      args: [AUTH_ATTR],
    });

    const value = results[0]?.result;
    return typeof value === 'string' && value.length > 0 ? value : null;
  } catch (error) {
    console.warn('[SyntaxAI] Could not read auth attribute from tab', tabId, error);
    return null;
  }
}

async function pollAuthTab(tabId: number): Promise<void> {
  if (watchedTabs.has(tabId)) {
    return;
  }

  const startedAt = Date.now();
  const timerId = globalThis.setInterval(() => {
    void (async () => {
      if (Date.now() - startedAt > POLL_FOR_MS) {
        globalThis.clearInterval(timerId);
        watchedTabs.delete(tabId);
        return;
      }

      const raw = await readAuthAttribute(tabId);
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

        globalThis.clearInterval(timerId);
        watchedTabs.delete(tabId);

        const result = await handleAuthPayloadFromTab({
          token: parsed.token,
          expiresAt: parsed.expiresAt,
          userId: parsed.userId,
        });

        if (result.ok) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: (attrName: string) => {
                document.documentElement.removeAttribute(attrName);
                window.postMessage(
                  { source: 'syntaxai-extension', type: 'syntaxai:auth-ack' },
                  window.location.origin,
                );
              },
              args: [AUTH_ATTR],
            });
          } catch {
            // Ack is best-effort — credentials are already saved.
          }
        }
      } catch (error) {
        console.warn('[SyntaxAI] Auth attribute parse/handoff failed', error);
      }
    })();
  }, POLL_MS);

  watchedTabs.set(tabId, timerId);
}

export function registerAuthTabWatcher(): void {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const url = changeInfo.url ?? tab.url;
    if (!isAuthExtensionUrl(url)) {
      return;
    }

    if (changeInfo.status === 'complete' || changeInfo.url) {
      void pollAuthTab(tabId);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    const timerId = watchedTabs.get(tabId);
    if (timerId !== undefined) {
      globalThis.clearInterval(timerId);
      watchedTabs.delete(tabId);
    }
  });

  // If the user already sits on the handoff page when the worker wakes up.
  // Query is limited to hosts we hold permission for (no `tabs` permission needed).
  void chrome.tabs
    .query({ url: ['https://syntaxai.app/*', 'https://www.syntaxai.app/*'] })
    .then((tabs) => {
      for (const tab of tabs) {
        if (typeof tab.id === 'number' && isAuthExtensionUrl(tab.url)) {
          void pollAuthTab(tab.id);
        }
      }
    })
    .catch((error: unknown) => {
      console.warn('[SyntaxAI] Auth tab query failed', error);
    });

  console.info('[SyntaxAI] Auth tab watcher ready', SITE_URL);
}
