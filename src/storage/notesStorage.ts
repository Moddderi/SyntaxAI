import {
  NOTES_CHANGED_EVENT,
  NOTES_STORAGE_KEY,
  type Note,
} from '../types/note';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function parseNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((item): item is Note => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const note = item as Record<string, unknown>;

    return (
      typeof note.id === 'string' &&
      typeof note.title === 'string' &&
      typeof note.code === 'string' &&
      typeof note.language === 'string' &&
      Array.isArray(note.tags) &&
      note.tags.every((tag) => typeof tag === 'string') &&
      typeof note.createdAt === 'string' &&
      typeof note.isStarred === 'boolean'
    );
  });
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
  return [...notes].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
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
  const nextNotes = notes.filter((note) => note.id !== id);
  await writeNotesToStorage(nextNotes);
}
