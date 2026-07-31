import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { saveNote } from '../storage/notesStorage';
import type { Note } from '../types/note';
import { formatNoteDate, formatTopicLabel } from '../utils/noteHelpers';
import { CodeBlock } from './CodeBlock';
import { NestedTechIcons } from './NestedTechIcons';

interface NoteDetailModalProps {
  note: Note | null;
  onClose: () => void;
}

export function NoteDetailModal({ note, onClose }: NoteDetailModalProps): ReactElement | null {
  const [title, setTitle] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setIsCopied(false);
    }
  }, [note]);

  useEffect(() => {
    if (!note) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, onClose]);

  const persistTitle = useCallback(
    (nextTitle: string): void => {
      if (!note) {
        return;
      }

      const trimmedTitle = nextTitle.trim();

      if (!trimmedTitle || trimmedTitle === note.title) {
        return;
      }

      void saveNote({ ...note, title: trimmedTitle });
    },
    [note],
  );

  const handleTitleBlur = (): void => {
    persistTitle(title);
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  const handleCopyCode = async (): Promise<void> => {
    if (!note) {
      return;
    }

    try {
      await navigator.clipboard.writeText(note.code);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  if (!note) {
    return null;
  }

  const summaryText =
    note.summary?.trim() ||
    'AI-описание появится для новых заметок после анализа кода.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="note-detail-title"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#1c1c20] bg-[#141417] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="border-b border-[#1c1c20] px-6 py-5">
          <div className="flex items-start gap-4">
            <NestedTechIcons
              language={note.language}
              primaryTech={note.primaryTech}
              size="lg"
            />

            <div className="min-w-0 flex-1">
              <input
                aria-label="Note title"
                className="w-full truncate bg-transparent text-xl font-semibold text-white outline-none transition placeholder:text-gray-500 focus:rounded-lg focus:bg-[#0d0d0f] focus:px-2 focus:py-1"
                id="note-detail-title"
                onBlur={handleTitleBlur}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={handleTitleKeyDown}
                type="text"
                value={title}
              />
              <p className="mt-1 text-sm text-gray-500">{formatNoteDate(note.createdAt)}</p>
            </div>

            <button
              aria-label="Close note detail"
              className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-[#0d0d0f] hover:text-white"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-5 rounded-2xl border border-transparent bg-[#0d0d0f] p-[1px] [background:linear-gradient(135deg,rgba(0,234,255,0.45),rgba(167,139,250,0.35))]">
            <div className="rounded-[15px] bg-[#0d0d0f] px-4 py-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#00eaff]">
                <span aria-hidden="true">✨</span>
                <span>AI Insight</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-300">{summaryText}</p>
            </div>
          </section>

          <section className="relative">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Code
              </h3>
              <div className="relative">
                <button
                  className="rounded-full border border-[#1c1c20] bg-[#0d0d0f] px-3 py-1.5 text-xs text-gray-300 transition hover:border-[#00eaff]/40 hover:text-[#00eaff]"
                  onClick={() => void handleCopyCode()}
                  type="button"
                >
                  Copy Code
                </button>
                {isCopied ? (
                  <span className="absolute -top-8 right-0 rounded-md bg-[#00eaff] px-2 py-1 text-[10px] font-semibold text-black">
                    Copied!
                  </span>
                ) : null}
              </div>
            </div>
            <CodeBlock code={note.code} language={note.language} size="md" />
          </section>
        </div>

        <footer className="border-t border-[#1c1c20] px-6 py-4">
          {note.topics.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {note.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-[#1c1c20] bg-[#0d0d0f] px-3 py-1 text-xs text-gray-400"
                >
                  {formatTopicLabel(topic)}
                </span>
              ))}
            </div>
          ) : null}

          {note.sourceType === 'tab' ? (
            <p className="text-xs text-gray-500">
              Source:{' '}
              {note.sourceUrl ? (
                <a
                  className="text-[#00eaff] transition hover:underline"
                  href={note.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {note.sourceUrl}
                </a>
              ) : (
                'Captured from browser tab'
              )}
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
