import type { ReactElement } from 'react';
import { DetectionConfirmedBadge, TechDetectionIndicator } from '../../components/TechDetectionIndicator';
import { formatTopicLabel } from '../../utils/noteHelpers';
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
  const hasTech = Boolean(note?.primaryTech && note?.language);
  const detectedNote = note;

  return (
    <section className="rounded-2xl border border-syntax-border bg-syntax-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-accent">
          DETECTED NOTE
        </h2>

        {!isAnalyzing && note ? <DetectionConfirmedBadge /> : null}
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
              className="w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-sm font-medium text-white outline-none transition placeholder:text-gray-500 focus:border-syntax-accent/30 focus:bg-syntax-bg focus:px-2"
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Note title"
              type="text"
              value={title}
            />

            {note && note.topics.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 animate-fade-in">
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

            {sourceUrl ? (
              <p className="mt-3 truncate text-[11px] text-gray-500">
                Source:{' '}
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
