import {
  DEVICE_TOKEN_STORAGE_KEY,
  SESSION_CACHE_STORAGE_KEY,
  TOKEN_EXPIRES_AT_STORAGE_KEY,
  USER_ID_STORAGE_KEY,
} from '../constants/storageKeys';
import { saveAuthCredentials, clearAuthCredentials } from '../storage/authStorage';
import { refreshSession } from '../services/sessionService';
import { runNotesSyncCycle } from '../services/notesSyncService';
import {
  RUNTIME_MESSAGE,
  type SyntaxAiAuthMessage,
  type SyntaxAiAuthResultResponse,
  type SyntaxAiRuntimeMessage,
} from '../types/runtimeMessages';

function isAuthMessage(message: unknown): message is SyntaxAiAuthMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const record = message as Record<string, unknown>;

  return (
    record.type === RUNTIME_MESSAGE.SYNTAXAI_AUTH &&
    typeof record.token === 'string' &&
    typeof record.expiresAt === 'string' &&
    typeof record.userId === 'string'
  );
}

async function handleAuthHandoff(message: SyntaxAiAuthMessage): Promise<SyntaxAiAuthResultResponse> {
  await saveAuthCredentials({
    token: message.token.trim(),
    expiresAt: message.expiresAt,
    userId: message.userId,
  });

  const session = await refreshSession();

  if (!session) {
    return { ok: false, signedIn: false, error: 'session_failed' };
  }

  try {
    await runNotesSyncCycle();
  } catch (error) {
    console.warn('[SyntaxAI] Sync after auth failed', error);
  }

  return { ok: true, signedIn: true };
}

export async function runStartupAuthAndSync(): Promise<void> {
  const session = await refreshSession();

  if (!session) {
    return;
  }

  try {
    await runNotesSyncCycle();
  } catch (error) {
    console.warn('[SyntaxAI] Startup sync failed', error);
  }
}

export function registerAuthMessageHandlers(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: SyntaxAiRuntimeMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: SyntaxAiAuthResultResponse) => void,
    ): boolean => {
      if (isAuthMessage(message)) {
        void handleAuthHandoff(message)
          .then(sendResponse)
          .catch(async () => {
            await clearAuthCredentials();
            sendResponse({ ok: false, signedIn: false, error: 'auth_failed' });
          });

        return true;
      }

      if (message.type === RUNTIME_MESSAGE.SYNTAXAI_REFRESH_SESSION) {
        void refreshSession()
          .then((session) => {
            sendResponse({ ok: Boolean(session), signedIn: Boolean(session) });
          })
          .catch(() => {
            sendResponse({ ok: false, signedIn: false, error: 'session_failed' });
          });

        return true;
      }

      return false;
    },
  );

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    if (
      changes[DEVICE_TOKEN_STORAGE_KEY] ||
      changes[SESSION_CACHE_STORAGE_KEY] ||
      changes[TOKEN_EXPIRES_AT_STORAGE_KEY] ||
      changes[USER_ID_STORAGE_KEY]
    ) {
      void refreshSession().catch(() => undefined);
    }
  });
}
