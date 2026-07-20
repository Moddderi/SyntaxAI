import { useState } from 'react';
import type { ReactElement } from 'react';
import { SNIPPET_ITEMS } from '../data/mockDashboardData';
import type { SnippetViewMode } from '../types/dashboard.types';
import { GridIcon, ListIcon } from './icons';
import { SnippetCard } from './SnippetCard';

export function SnippetGrid(): ReactElement {
  const [viewMode, setViewMode] = useState<SnippetViewMode>('grid');
  const totalCount = SNIPPET_ITEMS.length;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">All notes</h2>
          <p className="text-sm text-gray-400">
            {totalCount} of {totalCount} snippets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-[#1c1c20] bg-[#141417] p-1">
            <button
              aria-label="Grid view"
              className={`rounded-lg p-2 transition ${
                viewMode === 'grid'
                  ? 'bg-[#0d0d0f] text-[#00eaff]'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewMode('grid')}
              type="button"
            >
              <GridIcon />
            </button>
            <button
              aria-label="List view"
              className={`rounded-lg p-2 transition ${
                viewMode === 'list'
                  ? 'bg-[#0d0d0f] text-[#00eaff]'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewMode('list')}
              type="button"
            >
              <ListIcon />
            </button>
          </div>

          <button
            className="rounded-xl border border-[#1c1c20] bg-[#141417] px-3 py-2 text-xs text-gray-400 transition hover:text-white"
            type="button"
          >
            Recently updated
          </button>
        </div>
      </div>

      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
            : 'flex flex-col gap-3'
        }
      >
        {SNIPPET_ITEMS.map((snippet) => (
          <SnippetCard key={snippet.id} snippet={snippet} />
        ))}
      </div>
    </section>
  );
}
