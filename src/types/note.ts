export interface Note {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  createdAt: string;
  isStarred: boolean;
}

export const NOTES_STORAGE_KEY = 'syntaxai_notes';

export const NOTES_CHANGED_EVENT = 'syntaxai-notes-changed';

export {
  deleteNote,
  getNotes,
  saveNote,
  toggleStar,
} from '../storage/notesStorage';
