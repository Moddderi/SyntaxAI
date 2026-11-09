import {
  NOTES_CHANGED_EVENT,
  NOTES_STORAGE_KEY,
  type Note,
  type NoteSourceType,
} from '../types/note';
import { normalizeTopics } from '../services/aiService';
import {
  isBaseLanguageSlug,
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from '../utils/techDetection';
import { resolveNoteTechnology } from '../utils/pageContextTechDetection';
import { enqueueNoteSyncIds } from './syncQueueStorage';
import { resolveDeviconSlug } from '../utils/techIcon';

const NOTE_SOURCE_TYPES: NoteSourceType[] = ['code', 'image', 'tab'];

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function isNoteSourceType(value: unknown): value is NoteSourceType {
  return typeof value === 'string' && NOTE_SOURCE_TYPES.includes(value as NoteSourceType);
}

function migrateLegacyTopics(
  raw: Record<string, unknown>,
  primaryTech: string,
  language: string,
): string[] {
  if (Array.isArray(raw.topics) && raw.topics.every((topic) => typeof topic === 'string')) {
    return normalizeTopics(raw.topics);
  }

  if (!Array.isArray(raw.tags) || !raw.tags.every((tag) => typeof tag === 'string')) {
    return [];
  }

  const blocked = new Set([
    primaryTech,
    language,
    resolveDeviconSlug(primaryTech),
    resolveDeviconSlug(language),
  ]);

  return normalizeTopics(
    raw.tags.filter((tag) => {
      const normalized = tag.replace(/^#+/, '').trim().toLowerCase();
      return normalized.length > 0 && !blocked.has(normalized);
    }),
  );
}

function normalizeNote(raw: Record<string, unknown>): Note | null {
  if (
    typeof raw.id !== 'string' ||
    typeof raw.title !== 'string' ||
    typeof raw.code !== 'string' ||
    typeof raw.createdAt !== 'string' ||
    typeof raw.isStarred !== 'boolean'
  ) {
    return null;
  }

  const code = raw.code;
  const title = raw.title;
  const body = typeof raw.body === 'string' ? raw.body.trim() : undefined;
  const sourceUrl = typeof raw.sourceUrl === 'string' ? raw.sourceUrl.trim() : undefined;
  const storedLanguage =
    typeof raw.language === 'string' ? resolveDeviconSlug(raw.language) : 'javascript';

  const storedPrimaryTech =
    typeof raw.primaryTech === 'string'
      ? resolveDeviconSlug(raw.primaryTech)
      : resolvePrimaryTechnology(code, storedLanguage);

  const resolvedTech = resolveNoteTechnology({
    title,
    code,
    body,
    sourceUrl,
    language: storedLanguage,
    preferredPrimaryTech: storedPrimaryTech,
  });

  const primaryTech = resolvedTech.primaryTech;
  const language = isBaseLanguageSlug(storedLanguage)
    ? resolvedTech.language
    : resolveBaseLanguage(code, primaryTech, storedLanguage);

  const topics = migrateLegacyTopics(raw, primaryTech, language);

  return {
    id: raw.id,
    title: raw.title,
    code,
    primaryTech,
    language,
    topics,
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : undefined,
    body,
    sourceUrl,
    createdAt: raw.createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : raw.createdAt,
    isStarred: raw.isStarred,
    isDeleted: raw.isDeleted === true,
    sourceType: isNoteSourceType(raw.sourceType) ? raw.sourceType : 'code',
  };
}

function parseNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      return normalizeNote(item as Record<string, unknown>);
    })
    .filter((note): note is Note => note !== null);
}

function sortNotesByDate(notes: Note[]): Note[] {
  return [...notes].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function notifyNotesChanged(): void {
  window.dispatchEvent(new CustomEvent(NOTES_CHANGED_EVENT));
}

async function readNotesFromStorage(): Promise<Note[]> {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(NOTES_STORAGE_KEY);
    return parseNotes(result[NOTES_STORAGE_KEY]);
  }

  const raw = localStorage.getItem(NOTES_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return parseNotes(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

async function writeNotesToStorage(notes: Note[], options?: { skipSyncQueue?: boolean }): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [NOTES_STORAGE_KEY]: notes });
    return;
  }

  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  notifyNotesChanged();

  if (options?.skipSyncQueue) {
    return;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

async function persistNotes(notes: Note[], syncIds: string[], skipSyncQueue = false): Promise<void> {
  // Local write first — sync queue must not block the UI critical path.
  await writeNotesToStorage(notes, { skipSyncQueue });

  if (!skipSyncQueue && syncIds.length > 0) {
    void enqueueNoteSyncIds(syncIds);
  }
}

export async function getAllNotesRaw(): Promise<Note[]> {
  return readNotesFromStorage();
}

export async function writeNotesFromSync(notes: Note[]): Promise<void> {
  await writeNotesToStorage(notes, { skipSyncQueue: true });
}

export async function getNotes(): Promise<Note[]> {
  const notes = await readNotesFromStorage();
  return sortNotesByDate(notes.filter((note) => !note.isDeleted));
}

export async function getTrashNotes(): Promise<Note[]> {
  const notes = await readNotesFromStorage();
  return sortNotesByDate(notes.filter((note) => note.isDeleted));
}

export async function saveNote(note: Note): Promise<void> {
  const notes = await readNotesFromStorage();
  const existingIndex = notes.findIndex((item) => item.id === note.id);
  const nextNote: Note = {
    ...note,
    updatedAt: nowIso(),
  };

  if (existingIndex >= 0) {
    notes[existingIndex] = nextNote;
  } else {
    notes.unshift(nextNote);
  }

  await persistNotes(notes, [nextNote.id]);
}

export async function toggleStar(id: string): Promise<void> {
  const notes = await readNotesFromStorage();
  const targetIndex = notes.findIndex((note) => note.id === id);

  if (targetIndex < 0) {
    return;
  }

  notes[targetIndex] = {
    ...notes[targetIndex],
    isStarred: !notes[targetIndex].isStarred,
    updatedAt: nowIso(),
  };

  const noteId = notes[targetIndex].id;
  await persistNotes(notes, [noteId]);
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await readNotesFromStorage();
  const targetIndex = notes.findIndex((note) => note.id === id);

  if (targetIndex < 0) {
    return;
  }

  notes[targetIndex] = {
    ...notes[targetIndex],
    isDeleted: true,
    updatedAt: nowIso(),
  };

  await persistNotes(notes, [id]);
}

export async function restoreNote(id: string): Promise<void> {
  const notes = await readNotesFromStorage();
  const targetIndex = notes.findIndex((note) => note.id === id);

  if (targetIndex < 0) {
    return;
  }

  notes[targetIndex] = {
    ...notes[targetIndex],
    isDeleted: false,
    updatedAt: nowIso(),
  };

  await persistNotes(notes, [id]);
}

export async function permanentlyDeleteNote(id: string): Promise<void> {
  const notes = await readNotesFromStorage();
  const targetIndex = notes.findIndex((note) => note.id === id);

  if (targetIndex < 0) {
    return;
  }

  const tombstone: Note = {
    ...notes[targetIndex],
    isDeleted: true,
    updatedAt: nowIso(),
  };

  notes[targetIndex] = tombstone;
  await persistNotes(notes, [id]);

  const nextNotes = notes.filter((note) => note.id !== id);
  await writeNotesToStorage(nextNotes, { skipSyncQueue: true });
}
