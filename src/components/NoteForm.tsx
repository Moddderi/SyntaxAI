import { useEffect, useState, type ReactElement } from 'react';
import { AnalyzingBadge, CaptureSectionHeader, SectionEditButton } from './CaptureSectionHeader';
import { CodeCapturePanel } from './CodeCapturePanel';
import { ContextCapturePanel } from './ContextCapturePanel';
import { DetectionConfirmedBadge, TechDetectionIndicator } from './TechDetectionIndicator';
import { formatTopicLabel } from '../utils/noteHelpers';

export interface NoteFormValues {
  title: string;
  noteBody: string;
  code: string;
  language: string;
  primaryTech: string;
  tags: string[];
}

interface NoteFormProps {
  values: NoteFormValues;
  isAnalyzing: boolean;
  isTechConfirmed?: boolean;
  showContextBody?: boolean;
  error: string | null;
  sourceUrl?: string;
  onTitleChange: (value: string) => void;
  onNoteBodyChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onCancel?: () => void;
}

export function NoteForm({
  values,
  isAnalyzing,
  isTechConfirmed = false,
  showContextBody = true,
  error,
  sourceUrl,
  onTitleChange,
  onNoteBodyChange,
  onCodeChange,
  onCancel,
}: NoteFormProps): ReactElement {
  const hasTech = Boolean(values.primaryTech && values.language);
  const [isContextEditing, setIsContextEditing] = useState(false);
  const [isCodeEditing, setIsCodeEditing] = useState(false);

  useEffect(() => {
    if (isAnalyzing) {
      setIsContextEditing(false);
      setIsCodeEditing(false);
    }
  }, [isAnalyzing]);

  const showContextPreview =
    showContextBody && !isAnalyzing && Boolean(values.noteBody.trim()) && !isContextEditing;
  const showCodePreview = !isAnalyzing && Boolean(values.code.trim()) && !isCodeEditing;

  return (
    <section className="animate-fade-in rounded-2xl border border-syntax-border bg-syntax-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-accent">
            Context Capture
          </h2>
          <p className="mt-1 text-xs text-syntax-muted">
            {showContextBody
              ? 'Captured selection with rules and code. Edit before saving.'
              : 'Code-only capture mode. Title and code will be saved without page description.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAnalyzing ? (
            <AnalyzingBadge />
          ) : isTechConfirmed ? (
            <DetectionConfirmedBadge />
          ) : null}

          {onCancel ? (
            <button
              className="rounded-lg px-2 py-1 text-[11px] text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-text"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex items-start gap-3">
        <TechDetectionIndicator
          cardBackgroundClass="border-syntax-border bg-syntax-card"
          isAnalyzing={isAnalyzing}
          isConfirmed={isTechConfirmed}
          language={hasTech ? values.language : null}
          primaryTech={hasTech ? values.primaryTech : null}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <input
            aria-label="Note title"
            className="w-full rounded-xl border border-syntax-border bg-syntax-inset px-3 py-2 text-sm font-medium text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40"
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Note title"
            type="text"
            value={values.title}
          />

          {values.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
              {values.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-syntax-border bg-syntax-inset px-3 py-1 text-[11px] text-syntax-muted"
                >
                  {formatTopicLabel(tag)}
                </span>
              ))}
            </div>
          ) : null}

          {sourceUrl ? (
            <p className="mt-3 truncate text-[11px] text-syntax-muted">
              Source:{' '}
              <a
                className="text-syntax-accent hover:underline"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {sourceUrl}
              </a>
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {showContextBody ? (
          <section>
            <CaptureSectionHeader
              action={
                showContextPreview ? (
                  <SectionEditButton
                    label="Edit context"
                    onClick={() => setIsContextEditing(true)}
                  />
                ) : isContextEditing ? (
                  <SectionEditButton
                    label="Show preview"
                    onClick={() => setIsContextEditing(false)}
                  />
                ) : null
              }
              title="Note Body / Context"
            />

            <ContextCapturePanel
              content={values.noteBody}
              isAnalyzing={isAnalyzing}
              isEditing={isContextEditing}
              onContentChange={onNoteBodyChange}
            />
          </section>
        ) : null}

        <section>
          <CaptureSectionHeader
            action={
              showCodePreview ? (
                <SectionEditButton label="Edit code" onClick={() => setIsCodeEditing(true)} />
              ) : isCodeEditing ? (
                <SectionEditButton label="Show preview" onClick={() => setIsCodeEditing(false)} />
              ) : null
            }
            title="Code Block"
          />

          <CodeCapturePanel
            code={values.code}
            isAnalyzing={isAnalyzing}
            isEditing={isCodeEditing}
            language={values.language}
            onCodeChange={onCodeChange}
          />
        </section>
      </div>
    </section>
  );
}
