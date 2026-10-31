import { useCallback, useEffect, useState } from 'react';
import {
  DEVICE_TOKEN_STORAGE_KEY,
  SESSION_CACHE_STORAGE_KEY,
} from '../constants/storageKeys';
import { getSessionCache, hasAuthCredentials } from '../storage/authStorage';
import { hydrateBillingFromSessionCache, refreshSession } from '../services/sessionService';
import { RUNTIME_MESSAGE } from '../types/runtimeMessages';
import type { SyntaxAiSessionUser } from '../types/api';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

interface UseAuthSessionResult {
  status: AuthStatus;
  user: SyntaxAiSessionUser | null;
  refresh: () => Promise<void>;
}

export function useAuthSession(): UseAuthSessionResult {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SyntaxAiSessionUser | null>(null);

  const applySession = useCallback(async (): Promise<void> => {
    const signedIn = await hasAuthCredentials();

    if (!signedIn) {
      setStatus('signed_out');
      setUser(null);
      return;
    }

    const cached = await getSessionCache();

    if (cached) {
      setUser(cached.user);
      setStatus('signed_in');
    }

    const session = await refreshSession();

    if (!session) {
      setStatus('signed_out');
      setUser(null);
      return;
    }

    setUser(session.user);
    setStatus('signed_in');
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setStatus((current) => (current === 'signed_in' ? 'signed_in' : 'loading'));
    await applySession();
  }, [applySession]);

  useEffect(() => {
    void hydrateBillingFromSessionCache().then(() => applySession());

    const handleFocus = (): void => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        void chrome.runtime.sendMessage({
          type: RUNTIME_MESSAGE.SYNTAXAI_REFRESH_SESSION,
        });
        void chrome.runtime.sendMessage({
          type: RUNTIME_MESSAGE.SYNTAXAI_SYNC_PULL,
        });
      }

      void applySession();
    };

    window.addEventListener('focus', handleFocus);

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ): void => {
        if (
          areaName === 'local' &&
          (changes[DEVICE_TOKEN_STORAGE_KEY] || changes[SESSION_CACHE_STORAGE_KEY])
        ) {
          void applySession();
        }
      };

      chrome.storage.onChanged.addListener(listener);

      return () => {
        window.removeEventListener('focus', handleFocus);
        chrome.storage.onChanged.removeListener(listener);
      };
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [applySession]);

  return { status, user, refresh };
}
