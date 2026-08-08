export type NoteSourceType = 'code' | 'image' | 'tab';

export interface Note {
  id: string;
  title: string;
  code: string;
  primaryTech: string;
  language: string;
  topics: string[];
  summary?: string;
  body?: string;
  sourceUrl?: string;
  createdAt: string;
  isStarred: boolean;
  isDeleted?: boolean;
  sourceType?: NoteSourceType;
}

export const NOTES_STORAGE_KEY = 'syntaxai_notes';

export const NOTES_CHANGED_EVENT = 'syntaxai-notes-changed';

export {
  deleteNote,
  getNotes,
  getTrashNotes,
  permanentlyDeleteNote,
  restoreNote,
  saveNote,
  toggleStar,
} from '../storage/notesStorage';
