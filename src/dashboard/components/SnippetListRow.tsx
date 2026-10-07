import type { ReactElement } from 'react';
import { NestedTechIcons } from '../../components/NestedTechIcons';
import type { SnippetItem } from '../types/dashboard.types';
import { SnippetQuickActions } from './SnippetQuickActions';

interface SnippetListRowProps {
  snippet: SnippetItem;
  onToggleStar: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  isHighlighted?: boolean;
}

export function SnippetListRow({
  snippet,
  onToggleStar,
  onRequestDelete,
  onOpenDetail,
  isHighlighted = false,
}: SnippetListRowProps): ReactElement {
  return (
    <article
      className={`syntax-press syntax-focus-ring group relative flex cursor-pointer items-center gap-3 rounded-2xl border bg-syntax-card px-4 py-3 ${
        isHighlighted
          ? 'border-syntax-accent ring-2 ring-syntax-accent/30'
          : 'border-syntax-border hover:border-syntax-accent/30'
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
      <NestedTechIcons
        cardBackgroundClass="border-syntax-border bg-syntax-card"
        language={snippet.language}
        primaryTech={snippet.primaryTech}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-syntax-text">{snippet.title}</h3>
        {snippet.previewLine.trim() ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-syntax-muted">
            {snippet.previewLine}
          </p>
        ) : null}
      </div>

      <span className="hidden shrink-0 text-[10px] tabular-nums text-syntax-muted sm:inline">
        {snippet.updatedAt}
      </span>

      <SnippetQuickActions
        className="rounded-xl border border-syntax-border bg-syntax-inset/80 p-0.5"
        code={snippet.code}
        isStarred={snippet.isStarred}
        onRequestDelete={onRequestDelete}
        onToggleStar={onToggleStar}
        showCopy
        snippetId={snippet.id}
      />
    </article>
  );
}
