import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';
import { normalizeTopics } from '../services/aiService';
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
  const [topicsInput, setTopicsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback((): void => {
    if (!note) {
      return;
    }

    setTitle(note.title);
    setCode(note.code);
    setTopicsInput(note.topics.join(', '));
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

    const rawTopics = topicsInput
      .split(',')
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0);

    onSave({
      ...note,
      title: trimmedTitle,
      code: trimmedCode,
      topics: normalizeTopics(rawTopics),
    });

    setIsSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="edit-note-title"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#1c1c20] bg-[#141417] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="border-b border-[#1c1c20] px-6 py-4">
          <h2 className="text-lg font-semibold text-white" id="edit-note-title">
            Edit note
          </h2>
          <p className="mt-1 text-sm text-gray-400">Update title, code, or topics.</p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4" onSubmit={handleSubmit}>
          <label className="mb-2 block text-xs text-gray-400" htmlFor="edit-note-title-input">
            Title
          </label>
          <input
            className="mb-4 h-11 w-full rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 text-sm text-white outline-none transition focus:border-[#00eaff]/40"
            id="edit-note-title-input"
            onChange={(event) => setTitle(event.target.value)}
            type="text"
            value={title}
          />

          <label className="mb-2 block text-xs text-gray-400" htmlFor="edit-note-code">
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
            className="mb-4 min-h-[160px] w-full resize-y rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 py-2 font-mono text-sm text-gray-300 outline-none transition focus:border-[#00eaff]/40"
            id="edit-note-code"
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            value={code}
          />

          <label className="mb-2 block text-xs text-gray-400" htmlFor="edit-note-topics">
            Topics (comma-separated)
          </label>
          <input
            className="mb-6 h-11 w-full rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-[#00eaff]/40"
            id="edit-note-topics"
            onChange={(event) => setTopicsInput(event.target.value)}
            placeholder="auth, state-management, hooks"
            type="text"
            value={topicsInput}
          />

          <div className="mt-auto flex items-center gap-2">
            <button
              className="h-10 flex-1 rounded-full border border-[#1c1c20] text-sm text-gray-300 transition hover:bg-[#0d0d0f] hover:text-white"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-10 flex-1 rounded-full bg-[#00eaff] text-sm font-semibold text-black transition hover:bg-[#00eaff]/90 disabled:opacity-50"
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
