import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { useTranslation } from '../../hooks/useTranslation';
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
  title,
  emptyMessage,
  highlightedNoteId = null,
  onOpenDetail,
}: SnippetGridProps): ReactElement {
  const { t, locale } = useTranslation();
  const [viewMode, setViewMode] = useState<SnippetViewMode>('grid');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const totalCount = notes.length;
  const resolvedTitle = title ?? t('libraryAllNotes');

  const snippets = useMemo(
    () => notes.map((note) => noteToSnippetItem(note, locale)),
    [locale, notes],
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

  const countLabel =
    totalCount === 1
      ? t('librarySnippetCountOne', { count: totalCount })
      : t('librarySnippetCountMany', { count: totalCount });

  return (
    <section>
      <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-syntax-border/80 bg-syntax-bg/95 px-1 py-3 backdrop-blur-md">
        <div>
          <h2 className="syntax-title text-syntax-text">{resolvedTitle}</h2>
          <p className="mt-1 text-sm text-syntax-muted">
            {isLoading ? t('libraryLoading') : countLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-syntax-border bg-syntax-card p-1">
            <button
              aria-label={t('libraryGridView')}
              aria-pressed={viewMode === 'grid'}
              className={`syntax-press syntax-focus-ring rounded-lg p-2 ${
                viewMode === 'grid'
                  ? 'bg-syntax-accent text-syntax-accent-fg'
                  : 'text-syntax-muted hover:text-syntax-text'
              }`}
              onClick={() => setViewMode('grid')}
              type="button"
            >
              <GridIcon />
            </button>
            <button
              aria-label={t('libraryListView')}
              aria-pressed={viewMode === 'list'}
              className={`syntax-press syntax-focus-ring rounded-lg p-2 ${
                viewMode === 'list'
                  ? 'bg-syntax-accent text-syntax-accent-fg'
                  : 'text-syntax-muted hover:text-syntax-text'
              }`}
              onClick={() => setViewMode('list')}
              type="button"
            >
              <ListIcon />
            </button>
          </div>

          <span className="syntax-label rounded-xl border border-syntax-border bg-syntax-card px-3 py-2 text-[10px] text-syntax-muted">
            {t('libraryRecentlyUpdated')}
          </span>
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
        <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card px-6 py-14 text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-syntax-text">
            {isLoading ? t('libraryLoading') : t('libraryEmpty')}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-syntax-muted">
            {isLoading
              ? t('libraryLoadingLibrary')
              : (emptyMessage ?? t('libraryEmptyDefault'))}
          </p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteNoteId !== null}
        noteTitle={noteToDelete?.title ?? t('libraryThisNote')}
        onCancel={() => setDeleteNoteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
