import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { saveNote } from '../storage/notesStorage';
import type { Note } from '../types/note';
import { formatNoteDate, noteHasAiExplanation } from '../utils/noteHelpers';
import { resolveNoteTechnology } from '../utils/pageContextTechDetection';
import { AiInsightIcon } from './AiInsightIcon';
import { SyntaxSectionHead } from './SyntaxSectionHead';
import { CodeBlock } from './CodeBlock';
import { MarkdownContent } from './MarkdownContent';
import { StarIcon, TrashIcon } from '../dashboard/components/icons';
import { NestedTechIcons } from './NestedTechIcons';

interface NoteDetailModalProps {
  note: Note | null;
  onClose: () => void;
  onToggleStar?: (noteId: string) => void;
  onRequestDelete?: (noteId: string) => void;
}

interface EditFormState {
  title: string;
  summary: string;
  body: string;
  code: string;
}

function buildEditFormState(note: Note): EditFormState {
  return {
    title: note.title,
    summary: note.summary ?? '',
    body: note.body ?? '',
    code: note.code,
  };
}

const MODAL_ICON_BUTTON_CLASS =
  'flex h-8 w-8 items-center justify-center rounded-lg text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-accent';

export function NoteDetailModal({
  note,
  onClose,
  onToggleStar,
  onRequestDelete,
}: NoteDetailModalProps): ReactElement | null {
  const { t, locale } = useTranslation();
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
      const updatedNote: Note = {
        ...note,
        title: trimmedTitle,
        summary: editForm.summary.trim() || undefined,
        body: editForm.body.trim() || undefined,
        code: trimmedCode,
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

  const contextIncludesCode = /```[\w-]*\n[\s\S]*?```/.test(note.body ?? '');
  const showAiInsight = noteHasAiExplanation(note) || isEditing;
  const summaryMarkdown = note.summary?.trim() ?? '';
  const bodyMarkdown = note.body?.trim() ?? '';

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
        <header className="border-b border-syntax-accent/30 px-6 py-5">
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
                  className="w-full bg-transparent text-xl font-semibold leading-snug text-syntax-text outline-none transition placeholder:text-syntax-muted focus:rounded-lg focus:bg-syntax-inset focus:px-2 focus:py-1"
                  id="note-detail-title"
                  onBlur={handleTitleBlur}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  type="text"
                  value={title}
                />
              )}
              <time className="mt-1 block text-xs tabular-nums text-syntax-muted">
                {formatNoteDate(note.createdAt, locale)}
              </time>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {onToggleStar ? (
                <button
                  aria-label={
                    note.isStarred ? t('snippetActionUnstar') : t('snippetActionStar')
                  }
                  className={`${MODAL_ICON_BUTTON_CLASS} ${note.isStarred ? 'text-syntax-accent' : ''}`}
                  onClick={() => onToggleStar(note.id)}
                  type="button"
                >
                  <StarIcon className="h-4 w-4" filled={note.isStarred} />
                </button>
              ) : null}

              {onRequestDelete ? (
                <button
                  aria-label={t('snippetActionDelete')}
                  className={`${MODAL_ICON_BUTTON_CLASS} hover:text-red-400`}
                  onClick={() => onRequestDelete(note.id)}
                  type="button"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              ) : null}

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

        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-syntax-accent/30">
          {showAiInsight ? (
            <section className="px-6 py-5">
              <SyntaxSectionHead
                accent
                className="mb-4"
                icon={<AiInsightIcon />}
                title={t('noteDetailAiInsight')}
              />
              <p className="mb-4 text-xs leading-relaxed text-syntax-muted">
                {t('noteDetailAiInsightCaption')}
              </p>

              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    aria-label="AI insight summary"
                    className="min-h-[100px] w-full resize-y border border-syntax-border bg-syntax-inset px-3 py-3 text-sm leading-relaxed text-syntax-muted outline-none transition focus:border-syntax-accent/40"
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, summary: event.target.value } : current,
                      )
                    }
                    placeholder="Short AI summary…"
                    value={editForm.summary}
                  />
                  <textarea
                    aria-label="Note context body"
                    className="min-h-[180px] w-full resize-y border border-syntax-border bg-syntax-inset px-3 py-3 font-mono text-xs leading-relaxed text-syntax-muted outline-none transition focus:border-syntax-accent/40"
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, body: event.target.value } : current,
                      )
                    }
                    placeholder="Markdown context, rules, documentation…"
                    value={editForm.body}
                  />
                </div>
              ) : (
                <div className="space-y-4 text-sm text-syntax-muted">
                  {summaryMarkdown ? <MarkdownContent content={summaryMarkdown} /> : null}
                  {bodyMarkdown ? <MarkdownContent content={bodyMarkdown} /> : null}
                </div>
              )}
            </section>
          ) : null}

          {contextIncludesCode && !isEditing ? null : (
          <section className="relative px-6 py-5">
            <SyntaxSectionHead
              className="mb-4"
              title={t('noteDetailCode')}
              trailing={
                <div className="relative">
                  <button
                    className="rounded-full border border-syntax-border bg-syntax-inset px-3 py-1.5 text-xs text-syntax-muted transition hover:border-syntax-accent/40 hover:text-syntax-accent"
                    onClick={() => void handleCopyCode()}
                    type="button"
                  >
                    Copy Code
                  </button>
                  {isCopied ? (
                    <span className="absolute -top-8 right-0 rounded-md bg-syntax-accent px-2 py-1 text-[10px] font-semibold text-syntax-accent-fg">
                      Copied!
                    </span>
                  ) : null}
                </div>
              }
            />

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
          )}

          {saveError ? (
            <p className="mx-6 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {saveError}
            </p>
          ) : null}
        </div>

        <footer className="border-t border-syntax-accent/30 px-6 py-4">
          {isEditing ? (
            <div className="mb-3 flex flex-wrap gap-3">
              <button
                className="h-10 rounded-full bg-syntax-accent px-5 text-sm font-semibold text-syntax-accent-fg transition hover:bg-syntax-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
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
