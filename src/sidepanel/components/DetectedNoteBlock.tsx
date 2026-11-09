import type { ReactElement } from 'react';
import { SyntaxCaptureAnalyzingPanel } from '../../components/SyntaxNeonLoader';
import { DetectionConfirmedBadge, TechDetectionIndicator } from '../../components/TechDetectionIndicator';
import { useTranslation } from '../../hooks/useTranslation';
import type { DetectedNote } from '../types/capture.types';

interface DetectedNoteBlockProps {
  note: DetectedNote | null;
  title: string;
  isAnalyzing: boolean;
  error: string | null;
  onTitleChange: (title: string) => void;
  sourceUrl?: string;
}

export function DetectedNoteBlock({
  note,
  title,
  isAnalyzing,
  error,
  onTitleChange,
  sourceUrl,
}: DetectedNoteBlockProps): ReactElement {
  const { t } = useTranslation();
  const hasTech = Boolean(note?.primaryTech && note?.language);
  const detectedNote = note;

  return (
    <section className="syntax-elevated relative z-0 shrink-0 overflow-hidden rounded-2xl border border-syntax-border bg-syntax-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="syntax-label text-syntax-accent">{t('sidePanelDetectedNote')}</h2>

        {!isAnalyzing && note ? <DetectionConfirmedBadge /> : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      {isAnalyzing ? (
        <SyntaxCaptureAnalyzingPanel compact message={t('contextCaptureAnalyzing')} />
      ) : !note && !error ? (
        <p className="text-xs text-syntax-muted">{t('sidePanelDetectedHint')}</p>
      ) : (
        <div className="flex items-start gap-3">
          <TechDetectionIndicator
            cardBackgroundClass="border-syntax-card bg-syntax-card"
            isAnalyzing={isAnalyzing}
            isConfirmed={Boolean(note)}
            language={hasTech && detectedNote ? detectedNote.language : null}
            primaryTech={hasTech && detectedNote ? detectedNote.primaryTech : null}
            size="md"
          />

          <div className="min-w-0 flex-1">
            <input
              aria-label="Detected note title"
              className="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-sm font-medium text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/30 focus:bg-syntax-bg focus:px-2"
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder={t('sidePanelNoteTitle')}
              type="text"
              value={title}
            />

            {note?.summary?.trim() ? (
              <p className="mt-2 text-[13px] leading-relaxed text-syntax-muted">
                {note.summary.trim()}
              </p>
            ) : null}

            {sourceUrl ? (
              <p className="mt-3 truncate text-[11px] text-syntax-muted">
                {t('sidePanelSource')}:{' '}
                <a
                  className="text-syntax-accent hover:underline"
                  href={sourceUrl}
                  onClick={(event) => event.stopPropagation()}
                  rel="noreferrer"
                  target="_blank"
                >
                  {sourceUrl}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
