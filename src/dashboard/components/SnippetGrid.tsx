import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { toggleStar } from '../../storage/notesStorage';
import type { Note } from '../../types/note';
import { noteToSnippetItem } from '../../utils/noteHelpers';
import type { SnippetViewMode } from '../types/dashboard.types';
import { GridIcon, ListIcon } from './icons';
import { SnippetCard } from './SnippetCard';

interface SnippetGridProps {
  notes: Note[];
  isLoading: boolean;
  title?: string;
  emptyMessage?: string;
}

export function SnippetGrid({
  notes,
  isLoading,
  title = 'All notes',
  emptyMessage,
}: SnippetGridProps): ReactElement {
  const [viewMode, setViewMode] = useState<SnippetViewMode>('grid');
  const totalCount = notes.length;

  const snippets = useMemo(
    () => notes.map((note) => noteToSnippetItem(note)),
    [notes],
  );

  const handleToggleStar = useCallback((id: string): void => {
    void toggleStar(id);
  }, []);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-400">
            {isLoading ? 'Loading…' : `${totalCount} snippet${totalCount === 1 ? '' : 's'}`}
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

      {snippets.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
              : 'flex flex-col gap-3'
          }
        >
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              onToggleStar={handleToggleStar}
              snippet={snippet}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#1c1c20] bg-[#141417] p-10 text-center">
          <p className="text-sm text-gray-400">
            {isLoading
              ? 'Loading your library…'
              : (emptyMessage ??
                'No notes yet. Add code from the side panel to get started.')}
          </p>
        </div>
      )}
    </section>
  );
}
