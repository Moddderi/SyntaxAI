import type { ReactElement } from 'react';
import type { DetectedNote } from '../types/capture.types';

interface DetectedNoteBlockProps {
  note: DetectedNote;
}

export function DetectedNoteBlock({ note }: DetectedNoteBlockProps): ReactElement {
  return (
    <section className="rounded-2xl border border-syntax-border bg-syntax-card p-4">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-accent">
        DETECTED NOTE
      </h2>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-syntax-border bg-syntax-bg text-[11px] font-bold text-syntax-accent">
          {note.technologyLabel}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-white">{note.title}</h3>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-syntax-border bg-syntax-bg px-3 py-1 text-[11px] text-gray-400"
              >
                {tag}
              </span>
            ))}

            <button
              className="rounded-full border border-dashed border-syntax-border px-3 py-1 text-[11px] text-gray-400 transition hover:border-syntax-accent/40 hover:text-syntax-accent"
              type="button"
            >
              + tag
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
