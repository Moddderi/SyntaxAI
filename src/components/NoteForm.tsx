import type { ReactElement } from 'react';
import { CodeBlock } from './CodeBlock';
import { DetectionStatus, TechDetectionIndicator } from './TechDetectionIndicator';
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
  error,
  sourceUrl,
  onTitleChange,
  onNoteBodyChange,
  onCodeChange,
  onCancel,
}: NoteFormProps): ReactElement {
  const hasTech = Boolean(values.primaryTech && values.language);

  return (
    <section className="animate-fade-in rounded-2xl border border-[#1c1c20] bg-[#141417] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00eaff]">
            Context Capture
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Captured selection with rules and code. Edit before saving.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DetectionStatus
            isAnalyzing={isAnalyzing}
            isConfirmed={isTechConfirmed}
            label="AI analyzing…"
          />

          {onCancel ? (
            <button
              className="rounded-lg px-2 py-1 text-[11px] text-gray-500 transition hover:bg-[#0d0d0f] hover:text-white"
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
          cardBackgroundClass="border-[#141417] bg-[#141417]"
          isAnalyzing={isAnalyzing}
          isConfirmed={isTechConfirmed}
          language={hasTech ? values.language : null}
          primaryTech={hasTech ? values.primaryTech : null}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <input
            aria-label="Note title"
            className="w-full rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 py-2 text-sm font-medium text-white outline-none transition placeholder:text-gray-500 focus:border-[#00eaff]/40"
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={isAnalyzing ? 'Detecting title…' : 'Note title'}
            type="text"
            value={values.title}
          />

          {isAnalyzing && values.tags.length === 0 ? (
            <div className="mt-3 flex gap-2">
              <span className="h-6 w-16 animate-detect-skeleton rounded-full bg-[#1c1c20]" />
              <span className="h-6 w-20 animate-detect-skeleton rounded-full bg-[#1c1c20]" />
            </div>
          ) : null}

          {values.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
              {values.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#1c1c20] bg-[#0d0d0f] px-3 py-1 text-[11px] text-gray-400"
                >
                  {formatTopicLabel(tag)}
                </span>
              ))}
            </div>
          ) : null}

          {sourceUrl ? (
            <p className="mt-3 truncate text-[11px] text-gray-500">
              Source:{' '}
              <a
                className="text-[#00eaff] hover:underline"
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
        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Note Body / Context
          </span>
          <textarea
            aria-label="Note body"
            className="min-h-[160px] w-full resize-y rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 py-3 font-mono text-xs leading-relaxed text-gray-300 outline-none transition placeholder:text-gray-500 focus:border-[#00eaff]/40"
            onChange={(event) => onNoteBodyChange(event.target.value)}
            placeholder="Rules, documentation, bullet points, and descriptions…"
            value={values.noteBody}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Code Block
          </span>
          <textarea
            aria-label="Code block"
            className="min-h-[140px] w-full resize-y rounded-xl border border-[#1c1c20] bg-[#1a1b1e] px-3 py-3 font-mono text-xs leading-relaxed text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#00eaff]/40"
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder="Primary code snippet…"
            spellCheck={false}
            value={values.code}
          />

          {values.code.trim() ? (
            <div className="mt-3 animate-fade-in">
              <CodeBlock
                code={values.code}
                language={values.language}
                maxLines={6}
                showLanguageLabel
                size="sm"
              />
            </div>
          ) : null}
        </label>
      </div>
    </section>
  );
}
