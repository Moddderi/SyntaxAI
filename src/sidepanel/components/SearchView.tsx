import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
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

const MOCK_SEARCH_RESULTS: SearchResultItem[] = [
  {
    id: 'result-1',
    tech: 'typescript',
    title: 'useDebouncedValue',
    capturedAt: '12m ago',
    codePreview: 'const debounced = useDebouncedValue(value, 300);',
    tags: ['#react', '#hooks'],
    language: 'ts',
  },
  {
    id: 'result-2',
    tech: 'python',
    title: 'FastAPI dependency injection',
    capturedAt: '34m ago',
    codePreview: 'def get_db() -> Generator[Session, None, None]:',
    tags: ['#fastapi', '#python'],
    language: 'py',
  },
  {
    id: 'result-3',
    tech: 'go',
    title: 'Context timeout pattern',
    capturedAt: '1h ago',
    codePreview: 'ctx, cancel := context.WithTimeout(ctx, 5*time.Second)',
    tags: ['#go', '#context'],
    language: 'go',
  },
];

function SearchResultCard({ result }: { result: SearchResultItem }): ReactElement {
  return (
    <article className="rounded-2xl border border-syntax-border bg-syntax-card p-4 transition hover:border-syntax-accent/30">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <TechIcon size="md" tech={result.tech} />
          <h3 className="truncate text-sm font-medium text-white">{result.title}</h3>
        </div>
        <span className="shrink-0 text-[10px] text-gray-400">{result.capturedAt}</span>
      </div>

      <pre className="mb-3 overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-syntax-border bg-syntax-bg px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-300">
        {result.codePreview}
      </pre>

      <div className="flex flex-wrap gap-2">
        {result.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-syntax-border bg-syntax-bg px-3 py-1 text-[11px] text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

export function SearchView(): ReactElement {
  const [query, setQuery] = useState('');
  const [activeLanguage, setActiveLanguage] = useState<LanguageFilterId>('all');

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return MOCK_SEARCH_RESULTS.filter((result) => {
      const matchesLanguage =
        activeLanguage === 'all' || result.language === activeLanguage;

      if (!matchesLanguage) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        result.title,
        result.codePreview,
        result.tech,
        ...result.tags,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [activeLanguage, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          aria-label="Search notes"
          className="h-11 w-full rounded-xl border border-syntax-border bg-syntax-bg py-2 pl-10 pr-14 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-syntax-accent/40"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти по коду, тегу, заголовку..."
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
              <SearchResultCard key={result.id} result={result} />
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
