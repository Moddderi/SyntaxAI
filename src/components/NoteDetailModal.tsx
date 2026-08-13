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
import { resolveNoteTechnology } from '../utils/pageContextTechDetection';
import { CodeBlock } from './CodeBlock';
import { MarkdownContent } from './MarkdownContent';
import { NestedTechIcons } from './NestedTechIcons';

interface NoteDetailModalProps {
  note: Note | null;
  onClose: () => void;
}

interface EditFormState {
  title: string;
  summary: string;
  body: string;
  code: string;
  topicsInput: string;
}

function buildEditFormState(note: Note): EditFormState {
  return {
    title: note.title,
    summary: note.summary ?? '',
    body: note.body ?? '',
    code: note.code,
    topicsInput: note.topics.join(', '),
  };
}

function parseTopicsInput(input: string): string[] {
  return input
    .split(',')
    .map((topic) => topic.replace(/^#+/, '').trim())
    .filter((topic) => topic.length > 0);
}

export function NoteDetailModal({ note, onClose }: NoteDetailModalProps): ReactElement | null {
  const [title, setTitle] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setEditForm(buildEditFormState(note));
      setIsCopied(false);
      setIsEditing(false);
      setSaveError(null);
    }
  }, [note]);

  useEffect(() => {
    if (!note) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
          setEditForm(buildEditFormState(note));
          setSaveError(null);
          return;
        }

        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, note, onClose]);

  const persistTitle = useCallback(
    (nextTitle: string): void => {
      if (!note || isEditing) {
        return;
      }

      const trimmedTitle = nextTitle.trim();

      if (!trimmedTitle || trimmedTitle === note.title) {
        return;
      }

      void saveNote({ ...note, title: trimmedTitle });
    },
    [isEditing, note],
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

    const codeToCopy = isEditing && editForm ? editForm.code : note.code;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  const handleStartEditing = (): void => {
    if (!note) {
      return;
    }

    setEditForm(buildEditFormState(note));
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancelEditing = (): void => {
    if (!note) {
      return;
    }

    setEditForm(buildEditFormState(note));
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveEdits = async (): Promise<void> => {
    if (!note || !editForm) {
      return;
    }

    const trimmedTitle = editForm.title.trim();
    const trimmedCode = editForm.code.trim();

    if (!trimmedTitle) {
      setSaveError('Title cannot be empty.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const resolvedTech = resolveNoteTechnology({
        title: trimmedTitle,
        code: trimmedCode,
        body: editForm.body.trim() || undefined,
        sourceUrl: note.sourceUrl,
        language: note.language,
      });
      const topics = parseTopicsInput(editForm.topicsInput);

      const updatedNote: Note = {
        ...note,
        title: trimmedTitle,
        summary: editForm.summary.trim() || undefined,
        body: editForm.body.trim() || undefined,
        code: trimmedCode,
        topics,
        language: resolvedTech.language,
        primaryTech: resolvedTech.primaryTech,
      };

      await saveNote(updatedNote);
      setTitle(trimmedTitle);
      setIsEditing(false);
    } catch {
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!note || !editForm) {
    return null;
  }

  const summaryText =
    note.summary?.trim() ||
    'AI-описание появится для новых заметок после анализа кода.';

  const editPreviewTech = resolveNoteTechnology({
    title: editForm.title,
    code: editForm.code,
    body: editForm.body,
    sourceUrl: note.sourceUrl,
    language: note.language,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-syntax-overlay p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="note-detail-title"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-syntax-border bg-syntax-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="border-b border-syntax-border px-6 py-5">
          <div className="flex items-start gap-4">
            <NestedTechIcons
              language={note.language}
              primaryTech={note.primaryTech}
              size="lg"
            />

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  aria-label="Note title"
                  className="w-full rounded-xl border border-syntax-border bg-syntax-inset px-3 py-2 text-xl font-semibold text-syntax-text outline-none transition focus:border-syntax-accent/40"
                  id="note-detail-title"
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, title: event.target.value } : current,
                    )
                  }
                  type="text"
                  value={editForm.title}
                />
              ) : (
                <input
                  aria-label="Note title"
                  className="w-full truncate bg-transparent text-xl font-semibold text-syntax-text outline-none transition placeholder:text-syntax-muted focus:rounded-lg focus:bg-syntax-inset focus:px-2 focus:py-1"
                  id="note-detail-title"
                  onBlur={handleTitleBlur}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  type="text"
                  value={title}
                />
              )}
              <p className="mt-1 text-sm text-syntax-muted">{formatNoteDate(note.createdAt)}</p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  className="rounded-full border border-syntax-border bg-syntax-inset px-3 py-1.5 text-xs text-syntax-muted transition hover:border-syntax-accent/40 hover:text-syntax-accent"
                  onClick={handleStartEditing}
                  type="button"
                >
                  Edit
                </button>
              ) : null}

              <button
                aria-label="Close note detail"
                className="rounded-lg px-2 py-1 text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-text"
                onClick={onClose}
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-5 rounded-2xl border border-transparent bg-syntax-inset p-[1px] [background:linear-gradient(135deg,rgba(0,234,255,0.45),rgba(167,139,250,0.35))]">
            <div className="rounded-[15px] bg-syntax-inset px-4 py-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-syntax-accent">
                <span aria-hidden="true">✨</span>
                <span>AI Insight</span>
              </div>

              {isEditing ? (
                <textarea
                  aria-label="AI insight summary"
                  className="min-h-[100px] w-full resize-y rounded-xl border border-syntax-border bg-syntax-card px-3 py-3 text-sm leading-relaxed text-syntax-muted outline-none transition focus:border-syntax-accent/40"
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, summary: event.target.value } : current,
                    )
                  }
                  placeholder="Short AI summary…"
                  value={editForm.summary}
                />
              ) : (
                <MarkdownContent className="text-sm" content={summaryText} />
              )}
            </div>
          </section>

          {(note.body?.trim() || isEditing) ? (
            <section className="mb-5 rounded-2xl border border-syntax-border bg-syntax-inset px-4 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-syntax-muted">
                Context
              </h3>

              {isEditing ? (
                <textarea
                  aria-label="Note context body"
                  className="min-h-[180px] w-full resize-y rounded-xl border border-syntax-border bg-syntax-card px-3 py-3 font-mono text-xs leading-relaxed text-syntax-muted outline-none transition focus:border-syntax-accent/40"
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, body: event.target.value } : current,
                    )
                  }
                  placeholder="Markdown context, rules, documentation…"
                  value={editForm.body}
                />
              ) : note.body?.trim() ? (
                <MarkdownContent content={note.body} />
              ) : null}
            </section>
          ) : null}

          <section className="relative">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-syntax-muted">
                Code
              </h3>
              <div className="relative">
                <button
                  className="rounded-full border border-syntax-border bg-syntax-inset px-3 py-1.5 text-xs text-syntax-muted transition hover:border-syntax-accent/40 hover:text-syntax-accent"
                  onClick={() => void handleCopyCode()}
                  type="button"
                >
                  Copy Code
                </button>
                {isCopied ? (
                  <span className="absolute -top-8 right-0 rounded-md bg-syntax-accent px-2 py-1 text-[10px] font-semibold text-black">
                    Copied!
                  </span>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <textarea
                aria-label="Code block"
                className="min-h-[220px] w-full resize-y rounded-xl border border-syntax-border bg-syntax-code px-3 py-3 font-mono text-xs leading-relaxed text-syntax-muted outline-none transition focus:border-syntax-accent/40"
                onChange={(event) =>
                  setEditForm((current) =>
                    current ? { ...current, code: event.target.value } : current,
                  )
                }
                spellCheck={false}
                value={editForm.code}
              />
            ) : (
              <CodeBlock code={note.code} language={note.language} size="md" />
            )}

            {isEditing && editForm.code.trim() ? (
              <div className="mt-3 animate-fade-in">
                <CodeBlock code={editForm.code} language={editPreviewTech.language} size="sm" />
              </div>
            ) : null}
          </section>

          {isEditing ? (
            <section className="mt-5">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-syntax-muted">
                  Tags
                </span>
                <input
                  aria-label="Note tags"
                  className="w-full rounded-xl border border-syntax-border bg-syntax-inset px-3 py-2 text-sm text-syntax-muted outline-none transition focus:border-syntax-accent/40"
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, topicsInput: event.target.value } : current,
                    )
                  }
                  placeholder="forms, error-handling, validation"
                  type="text"
                  value={editForm.topicsInput}
                />
              </label>
              <p className="mt-2 text-[11px] text-syntax-muted">Separate tags with commas.</p>
            </section>
          ) : null}

          {saveError ? (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {saveError}
            </p>
          ) : null}
        </div>

        <footer className="border-t border-syntax-border px-6 py-4">
          {!isEditing && note.topics.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {note.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-syntax-border bg-syntax-inset px-3 py-1 text-xs text-syntax-muted"
                >
                  {formatTopicLabel(topic)}
                </span>
              ))}
            </div>
          ) : null}

          {isEditing ? (
            <div className="mb-3 flex flex-wrap gap-3">
              <button
                className="h-10 rounded-full bg-syntax-accent px-5 text-sm font-semibold text-black transition hover:bg-syntax-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={() => void handleSaveEdits()}
                type="button"
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                className="h-10 rounded-full border border-syntax-border px-5 text-sm text-syntax-muted transition hover:border-syntax-accent/40 hover:text-syntax-text"
                disabled={isSaving}
                onClick={handleCancelEditing}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {note.sourceType === 'tab' ? (
            <p className="text-xs text-syntax-muted">
              Source:{' '}
              {note.sourceUrl ? (
                <a
                  className="text-syntax-accent transition hover:underline"
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
