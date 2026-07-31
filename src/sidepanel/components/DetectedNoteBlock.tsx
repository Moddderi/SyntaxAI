import type { ReactElement } from 'react';
import { TechIcon } from '../../components/TechIcon';
import { formatTopicLabel } from '../../utils/noteHelpers';
import { getTechAbbreviation, resolveDeviconSlug } from '../../utils/techIcon';
import type { DetectedNote } from '../types/capture.types';

interface DetectedNoteBlockProps {
  note: DetectedNote | null;
  title: string;
  isAnalyzing: boolean;
  error: string | null;
  onTitleChange: (title: string) => void;
}

function AnalysisSpinner(): ReactElement {
  return (
    <div
      aria-hidden="true"
      className="h-5 w-5 animate-spin rounded-full border-2 border-syntax-border border-t-syntax-accent"
    />
  );
}

export function DetectedNoteBlock({
  note,
  title,
  isAnalyzing,
  error,
  onTitleChange,
}: DetectedNoteBlockProps): ReactElement {
  const primaryTechSlug = note ? resolveDeviconSlug(note.primaryTech) : 'typescript';
  const languageBadge = note
    ? getTechAbbreviation(note.language)
    : getTechAbbreviation('typescript');

  return (
    <section className="rounded-2xl border border-syntax-border bg-syntax-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-accent">
          DETECTED NOTE
        </h2>

        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <AnalysisSpinner />
            Analyzing…
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      {!note && !isAnalyzing && !error ? (
        <p className="text-xs text-gray-500">
          Add code, an instruction, or an image — then tap send or press ⌘/Ctrl + Enter.
        </p>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-syntax-border bg-syntax-bg">
              {note ? (
                <TechIcon size="md" tech={primaryTechSlug} />
              ) : (
                <span className="text-[11px] font-bold text-syntax-accent">
                  {languageBadge}
                </span>
              )}
            </div>
            {note ? (
              <span className="rounded-md border border-syntax-border bg-syntax-bg px-1.5 py-0.5 text-[9px] font-semibold text-gray-400">
                {languageBadge}
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <input
              aria-label="Detected note title"
              className="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-sm font-medium text-white outline-none transition placeholder:text-gray-500 focus:border-syntax-accent/30 focus:bg-syntax-bg focus:px-2"
              disabled={!note && isAnalyzing}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder={isAnalyzing ? 'Detecting title…' : 'Note title'}
              type="text"
              value={title}
            />

            {note && note.topics.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {note.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-syntax-border bg-syntax-bg px-3 py-1 text-[11px] text-gray-400"
                  >
                    {formatTopicLabel(topic)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
