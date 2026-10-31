import { apiFetchAuthed } from './apiClient';
import {
  buildSyncPushBatch,
  serverNoteToLocalNote,
  shouldApplyServerNote,
} from './notesSyncMapper';
import { getAllNotesRaw, writeNotesFromSync } from '../storage/notesStorage';
import { hasAuthCredentials } from '../storage/authStorage';
import {
  getDirtyNoteIds,
  getNotesSyncSince,
  removeDirtyNoteIds,
  setNotesSyncSince,
} from '../storage/syncQueueStorage';
import type { PullNotesResponse, PushNotesResponse } from '../types/api';

export async function pushDirtyNotesToServer(): Promise<void> {
  if (!(await hasAuthCredentials())) {
    return;
  }

  const dirtyIds = await getDirtyNoteIds();

  if (dirtyIds.length === 0) {
    return;
  }

  const notes = await getAllNotesRaw();
  const batch = buildSyncPushBatch(notes, dirtyIds);

  if (batch.length === 0) {
    await removeDirtyNoteIds(dirtyIds);
    return;
  }

  const response = await apiFetchAuthed('/api/v1/notes', {
    method: 'POST',
    body: JSON.stringify({ notes: batch }),
  });

  if (response.status === 401) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Notes push failed (${response.status})`);
  }

  const payload = (await response.json()) as PushNotesResponse;
  await removeDirtyNoteIds(batch.map((note) => note.id));

  if (payload.serverTime) {
    await setNotesSyncSince(payload.serverTime);
  }
}

export async function pullNotesFromServer(): Promise<void> {
  if (!(await hasAuthCredentials())) {
    return;
  }

  const since = await getNotesSyncSince();
  const path = since
    ? `/api/v1/notes?since=${encodeURIComponent(since)}`
    : '/api/v1/notes';

  const response = await apiFetchAuthed(path);

  if (response.status === 401) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Notes pull failed (${response.status})`);
  }

  const payload = (await response.json()) as PullNotesResponse;
  const localNotes = await getAllNotesRaw();
  const byId = new Map(localNotes.map((note) => [note.id, note]));
  let changed = false;

  payload.notes.forEach((serverNote) => {
    const local = byId.get(serverNote.id);

    if (
      !shouldApplyServerNote(local, serverNote.updatedAt, serverNote.deletedAt)
    ) {
      return;
    }

    if (serverNote.deletedAt) {
      if (local) {
        byId.set(
          serverNote.id,
          serverNoteToLocalNote(serverNote, local),
        );
      } else {
        byId.delete(serverNote.id);
      }

      changed = true;
      return;
    }

    byId.set(serverNote.id, serverNoteToLocalNote(serverNote, local ?? null));
    changed = true;
  });

  if (changed) {
    await writeNotesFromSync([...byId.values()]);
  }

  if (payload.serverTime) {
    await setNotesSyncSince(payload.serverTime);
  }
}

export async function runNotesSyncCycle(): Promise<void> {
  await pushDirtyNotesToServer();
  await pullNotesFromServer();
}
