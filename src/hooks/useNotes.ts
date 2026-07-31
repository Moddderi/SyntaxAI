import { useCallback, useEffect, useState } from 'react';
import { getNotes, getTrashNotes } from '../storage/notesStorage';
import { NOTES_CHANGED_EVENT, NOTES_STORAGE_KEY, type Note } from '../types/note';

interface UseNotesResult {
  notes: Note[];
  trashNotes: Note[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [activeNotes, deletedNotes] = await Promise.all([
      getNotes(),
      getTrashNotes(),
    ]);

    setNotes(activeNotes);
    setTrashNotes(deletedNotes);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    const handleStorageChange = (): void => {
      void refresh();
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ): void => {
        if (areaName === 'local' && changes[NOTES_STORAGE_KEY]) {
          void refresh();
        }
      };

      chrome.storage.onChanged.addListener(listener);
      window.addEventListener(NOTES_CHANGED_EVENT, handleStorageChange);

      return () => {
        chrome.storage.onChanged.removeListener(listener);
        window.removeEventListener(NOTES_CHANGED_EVENT, handleStorageChange);
      };
    }

    window.addEventListener(NOTES_CHANGED_EVENT, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(NOTES_CHANGED_EVENT, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refresh]);

  return { notes, trashNotes, isLoading, refresh };
}
