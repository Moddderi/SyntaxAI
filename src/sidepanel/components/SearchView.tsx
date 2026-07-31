import { useMemo, useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { useNotes } from '../../hooks/useNotes';
import { deleteNote } from '../../storage/notesStorage';
import {
  formatRelativeTime,
  formatTopicLabel,
  getCodePreview,
  noteLanguageToFilterId,
} from '../../utils/noteHelpers';
import { getTechAbbreviation, resolveDeviconSlug } from '../../utils/techIcon';
import type {
  LanguageFilterId,
  LanguageFilterOption,
  SearchResultItem,
} from '../types/capture.types';
import { SearchIcon } from './icons';
import { TechIcon } from '../../components/TechIcon';

const LANGUAGE_FILTERS: LanguageFilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'ts', label: 'TS', tech: 'typescript' },
  { id: 'py', label: 'PY', tech: 'python' },
  { id: 'go', label: 'GO', tech: 'go' },
  { id: 'sql', label: 'SQL', tech: 'postgresql' },
  { id: 'rs', label: 'RS', tech: 'rust' },
];

function SearchResultCard({
  result,
  onDelete,
  onOpenDetail,
}: {
  result: SearchResultItem;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
}): ReactElement {
  const languageBadge = getTechAbbreviation(result.language);

  return (
    <article
      className="cursor-pointer rounded-2xl border border-syntax-border bg-syntax-card p-5 transition hover:border-syntax-accent/30"
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
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <TechIcon size="md" tech={result.primaryTech} />
          <span className="rounded-md border border-syntax-border bg-syntax-bg px-1.5 py-0.5 text-[9px] font-semibold text-gray-400">
            {languageBadge}
          </span>
          <h3 className="truncate text-sm font-medium text-white">{result.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Delete note"
            className="rounded-lg p-1 text-gray-600 opacity-60 transition hover:text-red-400 hover:opacity-100"
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
          <span className="text-[10px] text-gray-400">{result.capturedAt}</span>
        </div>
      </div>

      <CodeBlock
        className="mb-3 border-syntax-border bg-syntax-bg"
        code={result.code}
        language={result.language}
        maxLines={4}
        size="md"
      />

      {result.topics.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {result.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-syntax-border bg-syntax-bg px-3 py-1 text-[11px] text-gray-400"
            >
              {formatTopicLabel(topic)}
            </span>
          ))}
        </div>
      ) : null}
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
  const [activeLanguage, setActiveLanguage] = useState<LanguageFilterId>('all');

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
        topics: note.topics,
        languageFilter: noteLanguageToFilterId(note.language),
      })),
    [notes],
  );

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return searchResults.filter((result) => {
      const matchesLanguage =
        activeLanguage === 'all' || result.languageFilter === activeLanguage;

      if (!matchesLanguage) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        result.title,
        result.codePreview,
        result.primaryTech,
        result.language,
        ...result.topics,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [activeLanguage, query, searchResults]);

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
          Filter · Language
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {LANGUAGE_FILTERS.map((filter) => {
            const isActive = activeLanguage === filter.id;

            return (
              <button
                key={filter.id}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                  isActive
                    ? 'border-syntax-accent text-syntax-accent'
                    : 'border-syntax-border bg-syntax-card text-gray-400 hover:border-syntax-accent/30 hover:text-white'
                }`}
                onClick={() => setActiveLanguage(filter.id)}
                type="button"
              >
                {filter.tech ? <TechIcon size="sm" tech={filter.tech} /> : null}
                {filter.label}
              </button>
            );
          })}
        </div>
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
        <div className="flex flex-col gap-3">
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
