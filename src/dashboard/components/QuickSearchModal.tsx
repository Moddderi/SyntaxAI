import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { TechIcon } from '../../components/TechIcon';
import type { Note } from '../../types/note';
import { formatTopicLabel, searchNotes } from '../../utils/noteHelpers';
import { SearchIcon } from './icons';

interface QuickSearchModalProps {
  isOpen: boolean;
  notes: Note[];
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export function QuickSearchModal({
  isOpen,
  notes,
  onClose,
  onSelectNote,
}: QuickSearchModalProps): ReactElement | null {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchNotes(notes, query), [notes, query]);

  const resetState = useCallback((): void => {
    setQuery('');
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetState();
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    (noteId: string): void => {
      onSelectNote(noteId);
      onClose();
    },
    [onClose, onSelectNote],
  );

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex].id);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-label="Quick search"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#1c1c20] bg-[#141417] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="relative border-b border-[#1c1c20]">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            aria-label="Search notes"
            className="h-14 w-full bg-transparent py-2 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-500"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search by title, code, or topics…"
            type="search"
            value={query}
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((note, index) => (
              <button
                key={note.id}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                  index === activeIndex
                    ? 'bg-[#00eaff]/10 text-white'
                    : 'text-gray-300 hover:bg-[#0d0d0f]'
                }`}
                onClick={() => handleSelect(note.id)}
                onMouseEnter={() => setActiveIndex(index)}
                type="button"
              >
                <TechIcon size="sm" tech={note.primaryTech} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{note.title}</span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-gray-500">
                    {note.code.slice(0, 80)}
                  </span>
                  {note.topics.length > 0 ? (
                    <span className="mt-1 block truncate text-[10px] text-gray-500">
                      {note.topics.map((topic) => formatTopicLabel(topic)).join(' ')}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-gray-500">
              {query.trim() ? 'No matching notes.' : 'Start typing to search your library.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
