import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { deleteNote, toggleStar } from '../../storage/notesStorage';
import type { Note } from '../../types/note';
import { noteToSnippetItem } from '../../utils/noteHelpers';
import type { SnippetViewMode } from '../types/dashboard.types';
import { GridIcon, ListIcon } from './icons';
import { SnippetCard } from './SnippetCard';
import { SnippetListRow } from './SnippetListRow';

interface SnippetGridProps {
  notes: Note[];
  isLoading: boolean;
  title?: string;
  emptyMessage?: string;
  highlightedNoteId?: string | null;
  onOpenDetail: (noteId: string) => void;
}

export function SnippetGrid({
  notes,
  isLoading,
  title = 'All notes',
  emptyMessage,
  highlightedNoteId = null,
  onOpenDetail,
}: SnippetGridProps): ReactElement {
  const [viewMode, setViewMode] = useState<SnippetViewMode>('grid');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const totalCount = notes.length;

  const snippets = useMemo(
    () => notes.map((note) => noteToSnippetItem(note)),
    [notes],
  );

  const noteToDelete = useMemo(
    () => notes.find((note) => note.id === deleteNoteId) ?? null,
    [deleteNoteId, notes],
  );

  const handleToggleStar = useCallback((id: string): void => {
    void toggleStar(id);
  }, []);

  const handleConfirmDelete = useCallback((): void => {
    if (!deleteNoteId) {
      return;
    }

    void deleteNote(deleteNoteId);
    setDeleteNoteId(null);
  }, [deleteNoteId]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-syntax-text">{title}</h2>
          <p className="text-sm text-syntax-muted">
            {isLoading ? 'Loading…' : `${totalCount} snippet${totalCount === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-syntax-border bg-syntax-card p-1">
            <button
              aria-label="Grid view"
              className={`rounded-lg p-2 transition ${
                viewMode === 'grid'
                  ? 'bg-syntax-inset text-syntax-accent'
                  : 'text-syntax-muted hover:text-syntax-text'
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
                  ? 'bg-syntax-inset text-syntax-accent'
                  : 'text-syntax-muted hover:text-syntax-text'
              }`}
              onClick={() => setViewMode('list')}
              type="button"
            >
              <ListIcon />
            </button>
          </div>

          <button
            className="rounded-xl border border-syntax-border bg-syntax-card px-3 py-2 text-xs text-syntax-muted transition hover:text-syntax-text"
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
              ? 'grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-2'
              : 'flex flex-col gap-2'
          }
        >
          {snippets.map((snippet) =>
            viewMode === 'grid' ? (
              <SnippetCard
                key={snippet.id}
                isHighlighted={highlightedNoteId === snippet.id}
                onOpenDetail={onOpenDetail}
                onRequestDelete={setDeleteNoteId}
                onToggleStar={handleToggleStar}
                snippet={snippet}
              />
            ) : (
              <SnippetListRow
                key={snippet.id}
                isHighlighted={highlightedNoteId === snippet.id}
                onOpenDetail={onOpenDetail}
                onRequestDelete={setDeleteNoteId}
                onToggleStar={handleToggleStar}
                snippet={snippet}
              />
            ),
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card p-10 text-center">
          <p className="text-sm text-syntax-muted">
            {isLoading
              ? 'Loading your library…'
              : (emptyMessage ??
                'No notes yet. Add code from the side panel to get started.')}
          </p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteNoteId !== null}
        noteTitle={noteToDelete?.title ?? 'this note'}
        onCancel={() => setDeleteNoteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
