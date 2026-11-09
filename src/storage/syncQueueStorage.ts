import { SYNC_DIRTY_NOTE_IDS_KEY, SYNC_SINCE_STORAGE_KEY } from '../constants/storageKeys';
import { RUNTIME_MESSAGE } from '../types/runtimeMessages';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

const FLUSH_DEBOUNCE_MS = 400;
let flushDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function requestBackgroundFlush(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    return;
  }

  if (flushDebounceTimer) {
    clearTimeout(flushDebounceTimer);
  }

  flushDebounceTimer = setTimeout(() => {
    flushDebounceTimer = null;
    void chrome.runtime
      .sendMessage({ type: RUNTIME_MESSAGE.SYNTAXAI_SYNC_FLUSH })
      .catch(() => undefined);
  }, FLUSH_DEBOUNCE_MS);
}

export async function getDirtyNoteIds(): Promise<string[]> {
  if (!isChromeStorageAvailable()) {
    return [];
  }

  const result = await chrome.storage.local.get(SYNC_DIRTY_NOTE_IDS_KEY);
  const raw = result[SYNC_DIRTY_NOTE_IDS_KEY];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export async function enqueueNoteSyncIds(noteIds: string[]): Promise<void> {
  if (noteIds.length === 0 || !isChromeStorageAvailable()) {
    return;
  }

  const existing = await getDirtyNoteIds();
  const merged = [...new Set([...existing, ...noteIds])];

  await chrome.storage.local.set({ [SYNC_DIRTY_NOTE_IDS_KEY]: merged });
  requestBackgroundFlush();
}

export async function removeDirtyNoteIds(noteIds: string[]): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  const removeSet = new Set(noteIds);
  const existing = await getDirtyNoteIds();
  const next = existing.filter((id) => !removeSet.has(id));

  await chrome.storage.local.set({ [SYNC_DIRTY_NOTE_IDS_KEY]: next });
}

export async function getNotesSyncSince(): Promise<string | null> {
  if (!isChromeStorageAvailable()) {
    return null;
  }

  const result = await chrome.storage.local.get(SYNC_SINCE_STORAGE_KEY);
  const since = result[SYNC_SINCE_STORAGE_KEY];

  return typeof since === 'string' && since.length > 0 ? since : null;
}

export async function setNotesSyncSince(serverTime: string): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }

  await chrome.storage.local.set({ [SYNC_SINCE_STORAGE_KEY]: serverTime });
}
