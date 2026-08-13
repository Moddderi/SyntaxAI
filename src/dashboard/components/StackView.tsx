import { useMemo, type ReactElement } from 'react';
import { TechIcon } from '../../components/TechIcon';
import type { Note } from '../../types/note';
import {
  computeStackTechItems,
  formatRelativeTime,
  type StackTechItem,
} from '../../utils/noteHelpers';

interface StackViewProps {
  notes: Note[];
  isLoading: boolean;
  onSelectTechnology: (techSlug: string) => void;
}

function StackTechCard({
  item,
  onSelect,
}: {
  item: StackTechItem;
  onSelect: (slug: string) => void;
}): ReactElement {
  const noteLabel = `${item.count} note${item.count === 1 ? '' : 's'}`;

  return (
    <button
      className="group relative overflow-hidden rounded-2xl border border-syntax-border bg-syntax-card p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-opacity-60"
      onClick={() => onSelect(item.slug)}
      style={{
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.03)`,
      }}
      type="button"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at top left, ${item.brandColor}18, transparent 70%)`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-35"
        style={{ backgroundColor: item.brandColor }}
      />

      <div className="relative">
        <div
          className="mb-4 inline-flex rounded-2xl border border-syntax-border bg-syntax-bg/80 p-3 shadow-lg transition group-hover:scale-[1.02]"
          style={{ boxShadow: `0 0 28px -10px ${item.brandColor}66` }}
        >
          <TechIcon className="h-12 w-12" size="lg" tech={item.slug} />
        </div>

        <h3 className="text-base font-semibold tracking-tight text-syntax-text">{item.label}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-syntax-muted">
          <span
            className="rounded-full px-2 py-0.5 font-medium"
            style={{
              backgroundColor: `${item.brandColor}14`,
              color: item.brandColor,
            }}
          >
            {noteLabel}
          </span>
          <span>·</span>
          <span>Updated {formatRelativeTime(item.lastActivityAt)}</span>
        </div>

        <p className="mt-3 text-[12px] text-syntax-muted opacity-0 transition group-hover:opacity-100">
          Open {item.label} notes →
        </p>
      </div>
    </button>
  );
}

function StackViewSkeleton(): ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-[168px] animate-pulse rounded-2xl border border-syntax-border bg-syntax-card"
        />
      ))}
    </div>
  );
}

export function StackView({
  notes,
  isLoading,
  onSelectTechnology,
}: StackViewProps): ReactElement {
  const stackItems = useMemo(() => computeStackTechItems(notes), [notes]);

  return (
    <section className="animate-fade-in">
      <header className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-syntax-accent">
          Technologies
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-syntax-text">Your stack</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-syntax-muted">
          Every note is tagged with a primary technology. Pick a stack to browse snippets,
          patterns, and context for that tool.
        </p>

        {!isLoading && stackItems.length > 0 ? (
          <p className="mt-3 text-[13px] text-syntax-muted">
            {stackItems.length} technolog{stackItems.length === 1 ? 'y' : 'ies'} · {notes.length}{' '}
            note{notes.length === 1 ? '' : 's'} total
          </p>
        ) : null}
      </header>

      {isLoading ? (
        <StackViewSkeleton />
      ) : stackItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {stackItems.map((item) => (
            <StackTechCard key={item.slug} item={item} onSelect={onSelectTechnology} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card/50 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-syntax-border bg-syntax-bg text-syntax-muted">
            <span className="text-xl">⌘</span>
          </div>
          <h2 className="text-base font-medium text-syntax-text">No technologies yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-syntax-muted">
            Capture code from a page or screenshot — SyntaxAI detects React, TypeScript, Prisma,
            and more automatically.
          </p>
        </div>
      )}
    </section>
  );
}
