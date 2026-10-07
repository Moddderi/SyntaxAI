import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { CaptureSectionHeader, SectionEditButton } from './CaptureSectionHeader';
import { CodeCapturePanel } from './CodeCapturePanel';
import { ContextCapturePanel } from './ContextCapturePanel';
import { DetectionConfirmedBadge, TechDetectionIndicator } from './TechDetectionIndicator';
import { SyntaxCaptureAnalyzingPanel } from './SyntaxNeonLoader';

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
  const { t } = useTranslation();
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
            {t('contextCaptureTitle')}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isAnalyzing && isTechConfirmed ? <DetectionConfirmedBadge /> : null}

          {onCancel ? (
            <button
              className="rounded-lg px-2 py-1 text-[11px] text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-text"
              onClick={onCancel}
              disabled={isAnalyzing}
              type="button"
            >
              {t('contextCaptureCancel')}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      {isAnalyzing ? (
        <SyntaxCaptureAnalyzingPanel message={t('contextCaptureAnalyzing')} />
      ) : (
        <>
          <div className="mb-4 flex items-start gap-3">
            <TechDetectionIndicator
              cardBackgroundClass="border-syntax-border bg-syntax-card"
              isAnalyzing={false}
              isConfirmed={isTechConfirmed}
              language={hasTech ? values.language : null}
              primaryTech={hasTech ? values.primaryTech : null}
              size="md"
            />

            <div className="min-w-0 flex-1">
              <input
                aria-label={t('sidePanelNoteTitle')}
                className="w-full rounded-xl border border-syntax-border bg-syntax-inset px-3 py-2 text-sm font-medium text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40"
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder={t('sidePanelNoteTitle')}
                type="text"
                value={values.title}
              />
            </div>
          </div>

          <div className="space-y-4">
            {showContextBody ? (
              <section>
                <CaptureSectionHeader
                  action={
                    showContextPreview ? (
                      <SectionEditButton
                        label={t('contextCaptureEditContext')}
                        onClick={() => setIsContextEditing(true)}
                      />
                    ) : isContextEditing ? (
                      <SectionEditButton
                        label={t('contextCaptureShowPreview')}
                        onClick={() => setIsContextEditing(false)}
                      />
                    ) : null
                  }
                  title={t('contextCaptureNoteBody')}
                />

                <ContextCapturePanel
                  content={values.noteBody}
                  isAnalyzing={false}
                  isEditing={isContextEditing}
                  onContentChange={onNoteBodyChange}
                />
              </section>
            ) : (
              <section>
                <CaptureSectionHeader
                  action={
                    showCodePreview ? (
                      <SectionEditButton
                        label={t('contextCaptureEditCode')}
                        onClick={() => setIsCodeEditing(true)}
                      />
                    ) : isCodeEditing ? (
                      <SectionEditButton
                        label={t('contextCaptureShowPreview')}
                        onClick={() => setIsCodeEditing(false)}
                      />
                    ) : null
                  }
                  title={t('contextCaptureCode')}
                />

                <CodeCapturePanel
                  code={values.code}
                  isAnalyzing={false}
                  isEditing={isCodeEditing}
                  language={values.language}
                  onCodeChange={onCodeChange}
                />
              </section>
            )}
          </div>

          {!showContextBody ? (
            <div
              className="mt-4 rounded-xl border border-syntax-accent/60 bg-syntax-inset px-3 py-2.5 shadow-[var(--syntax-glow)]"
              role="status"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-syntax-accent">
                {t('contextCaptureAiContextOffBadge')}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-syntax-muted">
                {t('contextCaptureDescNoContext')}
              </p>
            </div>
          ) : null}
        </>
      )}

      {sourceUrl ? (
        <p className="mt-4 truncate border-t border-syntax-border pt-3 text-[11px] text-syntax-muted">
          {t('sidePanelSource')}:{' '}
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
    </section>
  );
}
