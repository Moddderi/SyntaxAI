import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';
import type { Note } from '../types/note';
import { CodeBlock } from './CodeBlock';

interface EditNoteModalProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (note: Note) => void;
}

export function EditNoteModal({
  isOpen,
  note,
  onClose,
  onSave,
}: EditNoteModalProps): ReactElement | null {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback((): void => {
    if (!note) {
      return;
    }

    setTitle(note.title);
    setCode(note.code);
    setIsSaving(false);
  }, [note]);

  useEffect(() => {
    if (isOpen && note) {
      resetForm();
    }
  }, [isOpen, note, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedCode = code.trim();

    if (!trimmedTitle || !trimmedCode) {
      return;
    }

    setIsSaving(true);

    onSave({
      ...note,
      title: trimmedTitle,
      code: trimmedCode,
    });

    setIsSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-syntax-overlay p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="edit-note-title"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-syntax-border bg-syntax-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="border-b border-syntax-border px-6 py-4">
          <h2 className="text-lg font-semibold text-syntax-text" id="edit-note-title">
            Edit note
          </h2>
          <p className="mt-1 text-sm text-syntax-muted">Update title or code.</p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4" onSubmit={handleSubmit}>
          <label className="mb-2 block text-xs text-syntax-muted" htmlFor="edit-note-title-input">
            Title
          </label>
          <input
            className="mb-4 h-11 w-full rounded-xl border border-syntax-border bg-syntax-inset px-3 text-sm text-syntax-text outline-none transition focus:border-syntax-accent/40"
            id="edit-note-title-input"
            onChange={(event) => setTitle(event.target.value)}
            type="text"
            value={title}
          />

          <label className="mb-2 block text-xs text-syntax-muted" htmlFor="edit-note-code">
            Code
          </label>
          {code.trim() ? (
            <CodeBlock
              className="mb-3"
              code={code}
              language={note.language}
            />
          ) : null}
          <textarea
            className="mb-4 min-h-[160px] w-full resize-y rounded-xl border border-syntax-border bg-syntax-inset px-3 py-2 font-mono text-sm text-syntax-muted outline-none transition focus:border-syntax-accent/40"
            id="edit-note-code"
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            value={code}
          />

          <div className="mt-auto flex items-center gap-2">
            <button
              className="h-10 flex-1 rounded-full border border-syntax-border text-sm text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-text"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-10 flex-1 rounded-full bg-syntax-accent text-sm font-semibold text-syntax-accent-fg transition hover:bg-syntax-accent/90 disabled:opacity-50"
              disabled={isSaving || !title.trim() || !code.trim()}
              type="submit"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
