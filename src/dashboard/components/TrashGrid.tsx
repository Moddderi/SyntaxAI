import { useCallback, useMemo, type ReactElement } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { TechIcon } from '../../components/TechIcon';
import { useTranslation } from '../../hooks/useTranslation';
import { permanentlyDeleteNote, restoreNote } from '../../storage/notesStorage';
import type { Note } from '../../types/note';
import { noteToSnippetItem } from '../../utils/noteHelpers';
import { getTechAbbreviation } from '../../utils/techIcon';

interface TrashGridProps {
  notes: Note[];
  isLoading: boolean;
}

export function TrashGrid({ notes, isLoading }: TrashGridProps): ReactElement {
  const { t, locale } = useTranslation();

  const snippets = useMemo(
    () => notes.map((note) => noteToSnippetItem(note, locale)),
    [locale, notes],
  );

  const handleRestore = useCallback((id: string): void => {
    void restoreNote(id);
  }, []);

  const handlePermanentDelete = useCallback((id: string): void => {
    void permanentlyDeleteNote(id);
  }, []);

  const countLabel =
    snippets.length === 1
      ? t('trashCountOne', { count: snippets.length })
      : t('trashCountMany', { count: snippets.length });

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-syntax-text">{t('trashTitle')}</h2>
        <p className="text-sm text-syntax-muted">
          {isLoading ? t('libraryLoading') : countLabel}
        </p>
      </div>

      {snippets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snippets.map((snippet) => (
            <article
              key={snippet.id}
              className="flex flex-col rounded-2xl border border-syntax-border bg-syntax-card p-4 opacity-80"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TechIcon size="md" tech={snippet.primaryTech} />
                  <span className="rounded-md border border-syntax-border bg-syntax-inset px-1.5 py-0.5 text-[10px] font-semibold text-syntax-muted">
                    {getTechAbbreviation(snippet.language)}
                  </span>
                </div>
                <span className="text-[11px] text-syntax-muted">{snippet.updatedAt}</span>
              </div>

              <h3 className="mb-3 truncate text-sm font-semibold text-syntax-text">
                {snippet.title}
              </h3>

              <CodeBlock
                className="mb-4"
                code={snippet.code}
                language={snippet.language}
                maxLines={4}
              />

              <div className="mt-auto flex items-center gap-2">
                <button
                  className="h-9 flex-1 rounded-full border border-syntax-border text-xs text-syntax-muted transition hover:border-syntax-accent/40 hover:text-syntax-accent"
                  onClick={() => handleRestore(snippet.id)}
                  type="button"
                >
                  {t('trashRestore')}
                </button>
                <button
                  className="h-9 flex-1 rounded-full border border-red-400/20 text-xs text-red-300 transition hover:border-red-400/40 hover:bg-red-500/10"
                  onClick={() => handlePermanentDelete(snippet.id)}
                  type="button"
                >
                  {t('trashDeletePermanently')}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card p-10 text-center">
          <p className="text-sm text-syntax-muted">{t('trashEmpty')}</p>
        </div>
      )}
    </section>
  );
}
