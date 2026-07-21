import { useCallback, useEffect, useState } from 'react';
import { getNotes } from '../storage/notesStorage';
import { NOTES_CHANGED_EVENT, NOTES_STORAGE_KEY, type Note } from '../types/note';

interface UseNotesResult {
  notes: Note[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const storedNotes = await getNotes();
    setNotes(storedNotes);
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

  return { notes, isLoading, refresh };
}
