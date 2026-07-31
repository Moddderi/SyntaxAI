import type { MouseEvent, ReactElement } from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { NestedTechIcons } from '../../components/NestedTechIcons';
import { formatTopicLabel } from '../../utils/noteHelpers';
import type { SnippetItem } from '../types/dashboard.types';
import { EditIcon, StarIcon, TrashIcon } from './icons';

interface SnippetCardProps {
  snippet: SnippetItem;
  onToggleStar: (id: string) => void;
  onRequestEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  isHighlighted?: boolean;
}

export function SnippetCard({
  snippet,
  onToggleStar,
  onRequestEdit,
  onRequestDelete,
  onOpenDetail,
  isHighlighted = false,
}: SnippetCardProps): ReactElement {
  const stopPropagation = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
  };

  return (
    <article
      className={`group relative flex cursor-pointer flex-col rounded-3xl border bg-[#141417] p-6 transition ${
        isHighlighted
          ? 'border-[#00eaff] ring-2 ring-[#00eaff]/30'
          : 'border-[#1c1c20] hover:border-[#00eaff]/30'
      }`}
      data-note-id={snippet.id}
      onClick={() => onOpenDetail(snippet.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetail(snippet.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <button
        aria-label="Edit note"
        className="absolute right-4 top-4 z-10 rounded-lg bg-[#141417]/90 p-2 text-gray-500 opacity-0 shadow-sm transition hover:bg-[#0d0d0f] hover:text-[#00eaff] group-hover:opacity-100"
        onClick={(event) => {
          stopPropagation(event);
          onRequestEdit(snippet.id);
        }}
        type="button"
      >
        <EditIcon className="h-4 w-4" />
      </button>

      <div className="mb-4 pr-10">
        <div className="flex items-start gap-4">
          <NestedTechIcons
            language={snippet.language}
            primaryTech={snippet.primaryTech}
            size="lg"
          />

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-base font-semibold text-white">{snippet.title}</h3>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label={snippet.isStarred ? 'Remove from starred' : 'Add to starred'}
                  className="rounded-lg p-0.5 transition hover:bg-[#0d0d0f]"
                  onClick={(event) => {
                    stopPropagation(event);
                    onToggleStar(snippet.id);
                  }}
                  type="button"
                >
                  <StarIcon
                    className={snippet.isStarred ? 'text-[#00eaff]' : 'text-gray-600'}
                    filled={snippet.isStarred}
                  />
                </button>
                <span className="text-xs text-gray-500">{snippet.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CodeBlock
        className="mb-5 px-4 py-3"
        code={snippet.code}
        language={snippet.language}
        maxLines={4}
        size="md"
      />

      {snippet.topics.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-2.5 pr-10">
          {snippet.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-[#1c1c20] bg-[#0d0d0f] px-3 py-1.5 text-xs text-gray-400"
            >
              {formatTopicLabel(topic)}
            </span>
          ))}
        </div>
      ) : null}

      <button
        aria-label="Delete note"
        className="absolute bottom-4 right-4 z-10 rounded-lg bg-[#141417]/90 p-2 text-gray-500 opacity-0 shadow-sm transition hover:bg-[#0d0d0f] hover:text-red-400 group-hover:opacity-100"
        onClick={(event) => {
          stopPropagation(event);
          onRequestDelete(snippet.id);
        }}
        type="button"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </article>
  );
}
