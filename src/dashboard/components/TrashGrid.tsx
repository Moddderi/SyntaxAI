import { useCallback, useMemo, type ReactElement } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { permanentlyDeleteNote, restoreNote } from '../../storage/notesStorage';
import type { Note } from '../../types/note';
import { noteToSnippetItem } from '../../utils/noteHelpers';
import { getTechAbbreviation } from '../../utils/techIcon';
import { TechIcon } from '../../components/TechIcon';

interface TrashGridProps {
  notes: Note[];
  isLoading: boolean;
}

export function TrashGrid({ notes, isLoading }: TrashGridProps): ReactElement {
  const snippets = useMemo(
    () => notes.map((note) => noteToSnippetItem(note)),
    [notes],
  );

  const handleRestore = useCallback((id: string): void => {
    void restoreNote(id);
  }, []);

  const handlePermanentDelete = useCallback((id: string): void => {
    void permanentlyDeleteNote(id);
  }, []);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Trash</h2>
        <p className="text-sm text-gray-400">
          {isLoading
            ? 'Loading…'
            : `${snippets.length} deleted note${snippets.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {snippets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snippets.map((snippet) => (
            <article
              key={snippet.id}
              className="flex flex-col rounded-2xl border border-[#1c1c20] bg-[#141417] p-4 opacity-80"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TechIcon size="md" tech={snippet.primaryTech} />
                  <span className="rounded-md border border-[#1c1c20] bg-[#0d0d0f] px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                    {getTechAbbreviation(snippet.language)}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">{snippet.updatedAt}</span>
              </div>

              <h3 className="mb-3 truncate text-sm font-semibold text-white">
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
                  className="h-9 flex-1 rounded-full border border-[#1c1c20] text-xs text-gray-300 transition hover:border-[#00eaff]/40 hover:text-[#00eaff]"
                  onClick={() => handleRestore(snippet.id)}
                  type="button"
                >
                  Restore
                </button>
                <button
                  className="h-9 flex-1 rounded-full border border-red-400/20 text-xs text-red-300 transition hover:border-red-400/40 hover:bg-red-500/10"
                  onClick={() => handlePermanentDelete(snippet.id)}
                  type="button"
                >
                  Delete permanently
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#1c1c20] bg-[#141417] p-10 text-center">
          <p className="text-sm text-gray-400">Trash is empty.</p>
        </div>
      )}
    </section>
  );
}
