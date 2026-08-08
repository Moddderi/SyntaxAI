import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactElement } from 'react';
import { NestedTechIcons } from '../../components/NestedTechIcons';
import { useNotes } from '../../hooks/useNotes';
import { deleteNote } from '../../storage/notesStorage';
import {
  computeTechnologyNavItems,
  formatRelativeTime,
  formatTopicLabel,
  getCodePreview,
  getNotePreviewLine,
} from '../../utils/noteHelpers';
import { resolveDeviconSlug } from '../../utils/techIcon';
import type { SearchResultItem } from '../types/capture.types';
import { SearchIcon } from './icons';
import { TechIcon } from '../../components/TechIcon';

const COPY_FEEDBACK_MS = 2000;

function SearchResultCard({
  result,
  onDelete,
  onOpenDetail,
}: {
  result: SearchResultItem;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
}): ReactElement {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = useCallback(
    async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
      event.stopPropagation();

      try {
        await navigator.clipboard.writeText(result.code);
        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), COPY_FEEDBACK_MS);
      } catch {
        setIsCopied(false);
      }
    },
    [result.code],
  );

  return (
    <article
      className="cursor-pointer rounded-2xl border border-syntax-border bg-syntax-card p-3 transition hover:border-syntax-accent/30"
      onClick={() => onOpenDetail(result.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail(result.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2.5">
        <NestedTechIcons
          cardBackgroundClass="border-syntax-card bg-syntax-card"
          language={result.language}
          primaryTech={result.primaryTech}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white">
              {result.title}
            </h3>

            <div className="flex shrink-0 items-center gap-1">
              <div className="relative">
                <button
                  aria-label={isCopied ? 'Code copied' : 'Copy code'}
                  className="rounded-lg p-1 text-sm text-gray-500 transition hover:bg-syntax-bg hover:text-syntax-accent"
                  onClick={(event) => void handleCopyCode(event)}
                  type="button"
                >
                  {isCopied ? '✓' : '📋'}
                </button>
                {isCopied ? (
                  <span className="pointer-events-none absolute -top-7 right-0 whitespace-nowrap rounded-md bg-syntax-accent px-2 py-0.5 text-[10px] font-semibold text-black">
                    Copied!
                  </span>
                ) : null}
              </div>

              <button
                aria-label="Delete note"
                className="rounded-lg p-1 text-gray-600 opacity-70 transition hover:bg-syntax-bg hover:text-red-400 hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(result.id);
                }}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 7h16" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M6 7l1-3h10l1 3" />
                  <path d="M8 7v12h8V7" />
                </svg>
              </button>

              <span className="min-w-[2.75rem] text-right text-[10px] text-gray-500">
                {result.capturedAt}
              </span>
            </div>
          </div>

          <p className="mt-1 truncate text-xs text-zinc-400">{result.previewLine}</p>

          {result.topics.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-syntax-border bg-syntax-bg px-2 py-0.5 text-[10px] text-gray-400"
                >
                  {formatTopicLabel(topic)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function SearchView({
  onOpenDetail,
}: {
  onOpenDetail: (noteId: string) => void;
}): ReactElement {
  const { notes } = useNotes();
  const [query, setQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  const technologyFilters = useMemo(
    () => computeTechnologyNavItems(notes),
    [notes],
  );

  useEffect(() => {
    if (selectedTech && !technologyFilters.some((item) => item.tech === selectedTech)) {
      setSelectedTech(null);
    }
  }, [selectedTech, technologyFilters]);

  const handleDelete = useCallback((id: string): void => {
    void deleteNote(id);
  }, []);

  const searchResults = useMemo<SearchResultItem[]>(
    () =>
      notes.map((note) => ({
        id: note.id,
        primaryTech: resolveDeviconSlug(note.primaryTech),
        language: resolveDeviconSlug(note.language),
        title: note.title,
        capturedAt: formatRelativeTime(note.createdAt),
        code: note.code,
        codePreview: getCodePreview(note.code),
        summary: note.summary,
        previewLine: getNotePreviewLine(note.summary, note.code, note.body),
        topics: note.topics,
      })),
    [notes],
  );

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return searchResults.filter((result) => {
      const matchesTechnology =
        selectedTech === null || result.primaryTech === selectedTech;

      if (!matchesTechnology) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        result.title,
        result.previewLine,
        result.codePreview,
        result.summary ?? '',
        result.primaryTech,
        result.language,
        ...result.topics,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [query, searchResults, selectedTech]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          aria-label="Search notes"
          className="h-11 w-full rounded-xl border border-syntax-border bg-syntax-bg py-2 pl-10 pr-14 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-syntax-accent/40"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти по коду, теме, заголовку..."
          type="search"
          value={query}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-syntax-border bg-syntax-card px-1.5 py-0.5 text-[10px] text-gray-400">
          ⌘K
        </kbd>
      </div>

      <section>
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Filter · Technologies
        </h2>
        {technologyFilters.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            <button
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                selectedTech === null
                  ? 'border-syntax-accent text-syntax-accent'
                  : 'border-syntax-border bg-syntax-card text-gray-400 hover:border-syntax-accent/30 hover:text-white'
              }`}
              onClick={() => setSelectedTech(null)}
              type="button"
            >
              All
              <span className="text-[10px] opacity-70">{notes.length}</span>
            </button>

            {technologyFilters.map((filter) => {
              const isActive = selectedTech === filter.tech;

              return (
                <button
                  key={filter.id}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    isActive
                      ? 'border-syntax-accent text-syntax-accent'
                      : 'border-syntax-border bg-syntax-card text-gray-400 hover:border-syntax-accent/30 hover:text-white'
                  }`}
                  onClick={() => setSelectedTech(filter.tech)}
                  type="button"
                >
                  <TechIcon size="sm" tech={filter.tech} />
                  {filter.label}
                  <span className="text-[10px] opacity-70">{filter.count}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Technologies appear as you add notes.
          </p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Results
          </h2>
          <span className="text-[10px] font-medium text-syntax-accent">
            {filteredResults.length}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <SearchResultCard
                key={result.id}
                onDelete={handleDelete}
                onOpenDetail={onOpenDetail}
                result={result}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card p-6 text-center text-xs text-gray-400">
              No notes match your search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
