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
  const storedLanguage =
    typeof raw.language === 'string' ? resolveDeviconSlug(raw.language) : 'typescript';

  const primaryTech =
    typeof raw.primaryTech === 'string'
      ? resolveDeviconSlug(raw.primaryTech)
      : resolvePrimaryTechnology(code, storedLanguage);

  const language = isBaseLanguageSlug(storedLanguage)
    ? storedLanguage
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
    sourceUrl: typeof raw.sourceUrl === 'string' ? raw.sourceUrl.trim() : undefined,
    createdAt: raw.createdAt,
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

async function writeNotesToStorage(notes: Note[]): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [NOTES_STORAGE_KEY]: notes });
    return;
  }

  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  notifyNotesChanged();
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

  if (existingIndex >= 0) {
    notes[existingIndex] = note;
  } else {
    notes.unshift(note);
  }

  await writeNotesToStorage(notes);
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
  };

  await writeNotesToStorage(notes);
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
  };

  await writeNotesToStorage(notes);
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
  };

  await writeNotesToStorage(notes);
}

export async function permanentlyDeleteNote(id: string): Promise<void> {
  const notes = await readNotesFromStorage();
  const nextNotes = notes.filter((note) => note.id !== id);
  await writeNotesToStorage(nextNotes);
}
