import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEVICE_TOKEN_STORAGE_KEY,
  SESSION_CACHE_STORAGE_KEY,
} from '../constants/storageKeys';
import { getSessionCache, hasAuthCredentials } from '../storage/authStorage';
import { hydrateBillingFromSessionCache, refreshSession } from '../services/sessionService';
import { areBillingLimitsEnforced } from '../services/billingState';
import { RUNTIME_MESSAGE } from '../types/runtimeMessages';
import type { SyntaxAiSessionResponse, SyntaxAiSessionUser } from '../types/api';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

interface UseAuthSessionResult {
  status: AuthStatus;
  user: SyntaxAiSessionUser | null;
  /** Mirrors session.billing.enabled — when false, hide Free/Pro sales UI. */
  billingEnabled: boolean;
  refresh: () => Promise<void>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(fallback), ms);

    void promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        window.clearTimeout(timer);
        resolve(fallback);
      });
  });
}

function applyCachedSession(
  cached: SyntaxAiSessionResponse,
  setUser: (user: SyntaxAiSessionUser | null) => void,
  setBillingEnabled: (enabled: boolean) => void,
  setStatus: (status: AuthStatus) => void,
): void {
  setUser(cached.user);
  setBillingEnabled(cached.billing.enabled);
  setStatus('signed_in');
}

export function useAuthSession(): UseAuthSessionResult {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SyntaxAiSessionUser | null>(null);
  const [billingEnabled, setBillingEnabled] = useState(() => areBillingLimitsEnforced());
  const applyGenerationRef = useRef(0);
  const networkRefreshInFlightRef = useRef(false);

  const applySession = useCallback(async (options?: { network?: boolean }): Promise<void> => {
    const allowNetwork = options?.network !== false;
    const generation = ++applyGenerationRef.current;

    try {
      const cached = await withTimeout(getSessionCache(), 2_500, null);

      if (generation !== applyGenerationRef.current) {
        return;
      }

      // Paint from cache immediately so storage stalls never flash AuthGate.
      if (cached) {
        applyCachedSession(cached, setUser, setBillingEnabled, setStatus);
      }

      const signedIn = await withTimeout(hasAuthCredentials(), 2_500, cached !== null);

      if (generation !== applyGenerationRef.current) {
        return;
      }

      if (!signedIn) {
        if (!cached) {
          setStatus('signed_out');
          setUser(null);
          setBillingEnabled(false);
        }
        return;
      }

      if (!cached) {
        // Credentials exist but cache is empty — stay on loading until network (or timeout).
        setStatus((current) => (current === 'signed_in' ? current : 'loading'));
      }

      if (!allowNetwork) {
        if (cached) {
          applyCachedSession(cached, setUser, setBillingEnabled, setStatus);
        }
        return;
      }

      if (networkRefreshInFlightRef.current) {
        return;
      }

      networkRefreshInFlightRef.current = true;

      let session: SyntaxAiSessionResponse | null = null;

      try {
        session = await refreshSession();
      } finally {
        networkRefreshInFlightRef.current = false;
      }

      if (generation !== applyGenerationRef.current) {
        return;
      }

      if (!session) {
        if (!cached) {
          setStatus('signed_out');
          setUser(null);
          setBillingEnabled(false);
        }
        return;
      }

      setUser(session.user);
      setBillingEnabled(session.billing.enabled);
      setStatus('signed_in');
    } catch {
      if (generation !== applyGenerationRef.current) {
        return;
      }

      const cached = await withTimeout(getSessionCache(), 1_500, null);

      if (generation !== applyGenerationRef.current) {
        return;
      }

      if (cached) {
        applyCachedSession(cached, setUser, setBillingEnabled, setStatus);
        return;
      }

      setStatus('signed_out');
      setUser(null);
      setBillingEnabled(false);
    } finally {
      if (generation === applyGenerationRef.current) {
        // Safety net: never leave the UI on "…" forever.
        setStatus((current) => (current === 'loading' ? 'signed_out' : current));
      }
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setStatus((current) => (current === 'signed_in' ? 'signed_in' : 'loading'));
    await applySession({ network: true });
  }, [applySession]);

  useEffect(() => {
    void hydrateBillingFromSessionCache()
      .then(() => {
        setBillingEnabled(areBillingLimitsEnforced());
        return applySession({ network: true });
      })
      .catch(() => {
        setStatus('signed_out');
        setUser(null);
        setBillingEnabled(false);
      });

    const handleFocus = (): void => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        void chrome.runtime.sendMessage({
          type: RUNTIME_MESSAGE.SYNTAXAI_REFRESH_SESSION,
        });
        void chrome.runtime.sendMessage({
          type: RUNTIME_MESSAGE.SYNTAXAI_SYNC_PULL,
        });
      }

      // Focus already asks background to refresh; UI only re-reads storage.
      void applySession({ network: false });
    };

    window.addEventListener('focus', handleFocus);

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ): void => {
        if (areaName !== 'local') {
          return;
        }

        if (changes[DEVICE_TOKEN_STORAGE_KEY]) {
          void applySession({ network: true });
          return;
        }

        // Cache write after refresh — hydrate UI only. Never re-fetch (that loops).
        if (changes[SESSION_CACHE_STORAGE_KEY]) {
          void applySession({ network: false });
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

  return { status, user, billingEnabled, refresh };
}
