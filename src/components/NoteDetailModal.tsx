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
import {
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from '../utils/techDetection';
import { resolveDeviconSlug } from '../utils/techIcon';
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
      const language = resolveBaseLanguage(trimmedCode, note.primaryTech, note.language);
      const primaryTech = resolvePrimaryTechnology(trimmedCode, language);
      const topics = parseTopicsInput(editForm.topicsInput);

      const updatedNote: Note = {
        ...note,
        title: trimmedTitle,
        summary: editForm.summary.trim() || undefined,
        body: editForm.body.trim() || undefined,
        code: trimmedCode,
        topics,
        language: resolveDeviconSlug(language),
        primaryTech: resolveDeviconSlug(primaryTech),
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

  const previewLanguage = resolveDeviconSlug(
    resolveBaseLanguage(editForm.code, note.primaryTech, note.language),
  );

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
              {isEditing ? (
                <input
                  aria-label="Note title"
                  className="w-full rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 py-2 text-xl font-semibold text-white outline-none transition focus:border-[#00eaff]/40"
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
                  className="w-full truncate bg-transparent text-xl font-semibold text-white outline-none transition placeholder:text-gray-500 focus:rounded-lg focus:bg-[#0d0d0f] focus:px-2 focus:py-1"
                  id="note-detail-title"
                  onBlur={handleTitleBlur}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  type="text"
                  value={title}
                />
              )}
              <p className="mt-1 text-sm text-gray-500">{formatNoteDate(note.createdAt)}</p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  className="rounded-full border border-[#1c1c20] bg-[#0d0d0f] px-3 py-1.5 text-xs text-gray-300 transition hover:border-[#00eaff]/40 hover:text-[#00eaff]"
                  onClick={handleStartEditing}
                  type="button"
                >
                  Edit
                </button>
              ) : null}

              <button
                aria-label="Close note detail"
                className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-[#0d0d0f] hover:text-white"
                onClick={onClose}
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-5 rounded-2xl border border-transparent bg-[#0d0d0f] p-[1px] [background:linear-gradient(135deg,rgba(0,234,255,0.45),rgba(167,139,250,0.35))]">
            <div className="rounded-[15px] bg-[#0d0d0f] px-4 py-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#00eaff]">
                <span aria-hidden="true">✨</span>
                <span>AI Insight</span>
              </div>

              {isEditing ? (
                <textarea
                  aria-label="AI insight summary"
                  className="min-h-[100px] w-full resize-y rounded-xl border border-[#1c1c20] bg-[#141417] px-3 py-3 text-sm leading-relaxed text-gray-300 outline-none transition focus:border-[#00eaff]/40"
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
            <section className="mb-5 rounded-2xl border border-[#1c1c20] bg-[#0d0d0f] px-4 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Context
              </h3>

              {isEditing ? (
                <textarea
                  aria-label="Note context body"
                  className="min-h-[180px] w-full resize-y rounded-xl border border-[#1c1c20] bg-[#141417] px-3 py-3 font-mono text-xs leading-relaxed text-gray-300 outline-none transition focus:border-[#00eaff]/40"
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

            {isEditing ? (
              <textarea
                aria-label="Code block"
                className="min-h-[220px] w-full resize-y rounded-xl border border-[#1c1c20] bg-[#1a1b1e] px-3 py-3 font-mono text-xs leading-relaxed text-gray-200 outline-none transition focus:border-[#00eaff]/40"
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
                <CodeBlock code={editForm.code} language={previewLanguage} size="sm" />
              </div>
            ) : null}
          </section>

          {isEditing ? (
            <section className="mt-5">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Tags
                </span>
                <input
                  aria-label="Note tags"
                  className="w-full rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 py-2 text-sm text-gray-300 outline-none transition focus:border-[#00eaff]/40"
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
              <p className="mt-2 text-[11px] text-gray-500">Separate tags with commas.</p>
            </section>
          ) : null}

          {saveError ? (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {saveError}
            </p>
          ) : null}
        </div>

        <footer className="border-t border-[#1c1c20] px-6 py-4">
          {!isEditing && note.topics.length > 0 ? (
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

          {isEditing ? (
            <div className="mb-3 flex flex-wrap gap-3">
              <button
                className="h-10 rounded-full bg-[#00eaff] px-5 text-sm font-semibold text-black transition hover:bg-[#00eaff]/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={() => void handleSaveEdits()}
                type="button"
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                className="h-10 rounded-full border border-[#1c1c20] px-5 text-sm text-gray-300 transition hover:border-[#00eaff]/40 hover:text-white"
                disabled={isSaving}
                onClick={handleCancelEditing}
                type="button"
              >
                Cancel
              </button>
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
