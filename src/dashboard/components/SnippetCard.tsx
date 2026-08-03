import type { ReactElement } from 'react';
import { NestedTechIcons } from '../../components/NestedTechIcons';
import { CodeBlock } from '../../components/CodeBlock';
import { formatTopicLabel } from '../../utils/noteHelpers';
import type { SnippetItem } from '../types/dashboard.types';
import { SnippetQuickActions } from './SnippetQuickActions';

interface SnippetCardProps {
  snippet: SnippetItem;
  onToggleStar: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  isHighlighted?: boolean;
}

export function SnippetCard({
  snippet,
  onToggleStar,
  onRequestDelete,
  onOpenDetail,
  isHighlighted = false,
}: SnippetCardProps): ReactElement {
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
      <SnippetQuickActions
        code={snippet.code}
        isStarred={snippet.isStarred}
        onRequestDelete={onRequestDelete}
        onToggleStar={onToggleStar}
        snippetId={snippet.id}
        variant="floating"
      />

      <div className="mb-4 pr-28">
        <div className="flex items-start gap-4">
          <NestedTechIcons
            language={snippet.language}
            primaryTech={snippet.primaryTech}
            size="lg"
          />

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white">
                {snippet.title}
              </h3>
              <span className="shrink-0 text-xs text-gray-500">{snippet.updatedAt}</span>
            </div>
          </div>
        </div>
      </div>

      {snippet.summary?.trim() ? (
        <p className="mb-3 truncate text-xs text-zinc-400">{snippet.previewLine}</p>
      ) : null}

      <CodeBlock
        className="mb-5"
        code={snippet.code}
        language={snippet.language}
        maxLines={4}
        showLanguageLabel
        size="md"
      />

      {snippet.topics.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-2.5">
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
    </article>
  );
}
