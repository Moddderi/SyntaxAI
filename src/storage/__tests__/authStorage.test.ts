import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthCredentials,
  getDeviceToken,
  getSessionCache,
  hasAuthCredentials,
  saveAuthCredentials,
  saveSessionCache,
} from '../authStorage';
import { SESSION_CACHE_STORAGE_KEY } from '../../constants/storageKeys';
import type { SyntaxAiSessionResponse } from '../../types/api';

type StorageRecord = Record<string, unknown>;

interface FakeChrome {
  store: StorageRecord;
  setCalls: StorageRecord[];
}

function installFakeChrome(): FakeChrome {
  const store: StorageRecord = {};
  const setCalls: StorageRecord[] = [];

  const fake = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: StorageRecord) => {
          setCalls.push(items);
          Object.assign(store, items);
        }),
        remove: vi.fn(async (keys: string[]) => {
          for (const key of keys) {
            delete store[key];
          }
        }),
      },
    },
  };

  (globalThis as unknown as { chrome: unknown }).chrome = fake;

  return { store, setCalls };
}

function makeSession(overrides: Partial<SyntaxAiSessionResponse['user']> = {}): SyntaxAiSessionResponse {
  return {
    user: { id: 'u1', email: 'dev@syntaxai.app', name: 'Dev', plan: 'free', ...overrides },
    billing: { enabled: false, limits: null },
    sync: { notesPath: '/api/v1/notes', strategy: 'local-first' },
  };
}

describe('authStorage', () => {
  let fake: FakeChrome;

  beforeEach(() => {
    fake = installFakeChrome();
  });

  afterEach(() => {
    delete (globalThis as unknown as { chrome?: unknown }).chrome;
  });

  it('reports signed out until a token is stored', async () => {
    expect(await hasAuthCredentials()).toBe(false);

    await saveAuthCredentials({
      token: 'sat_abc',
      expiresAt: '2027-11-01T00:00:00.000Z',
      userId: 'u1',
    });

    expect(await hasAuthCredentials()).toBe(true);
    expect(await getDeviceToken()).toBe('sat_abc');
  });

  it('trims whitespace-only tokens to signed out', async () => {
    fake.store.syntaxai_device_token = '   ';

    expect(await getDeviceToken()).toBeNull();
  });

  it('clears credentials and the cached session on sign out', async () => {
    await saveAuthCredentials({
      token: 'sat_abc',
      expiresAt: '2027-11-01T00:00:00.000Z',
      userId: 'u1',
    });
    await saveSessionCache(makeSession());

    await clearAuthCredentials();

    expect(await hasAuthCredentials()).toBe(false);
    expect(await getSessionCache()).toBeNull();
  });

  it('round-trips the session cache', async () => {
    await saveSessionCache(makeSession({ name: 'Oleh' }));

    const cached = await getSessionCache();

    expect(cached?.user.name).toBe('Oleh');
    expect(cached?.billing.enabled).toBe(false);
  });

  it('skips identical session writes so storage.onChanged cannot loop', async () => {
    await saveSessionCache(makeSession());
    const writesAfterFirst = fake.setCalls.length;

    await saveSessionCache(makeSession());

    expect(fake.setCalls.length).toBe(writesAfterFirst);
  });

  it('writes again when the session actually changes', async () => {
    await saveSessionCache(makeSession());
    const writesAfterFirst = fake.setCalls.length;

    await saveSessionCache(makeSession({ name: 'Renamed' }));

    expect(fake.setCalls.length).toBe(writesAfterFirst + 1);
  });

  it('rejects a malformed cached session', async () => {
    fake.store[SESSION_CACHE_STORAGE_KEY] = { user: { id: 1 } };

    expect(await getSessionCache()).toBeNull();
  });
});
