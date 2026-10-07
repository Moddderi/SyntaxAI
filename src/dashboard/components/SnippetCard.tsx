import type { ReactElement } from 'react';
import { NestedTechIcons } from '../../components/NestedTechIcons';
import { CodeBlock } from '../../components/CodeBlock';
import type { SnippetItem } from '../types/dashboard.types';

interface SnippetCardProps {
  snippet: SnippetItem;
  onOpenDetail: (id: string) => void;
  isHighlighted?: boolean;
}

export function SnippetCard({
  snippet,
  onOpenDetail,
  isHighlighted = false,
}: SnippetCardProps): ReactElement {
  return (
    <article
      className={`syntax-elevated syntax-press syntax-focus-ring relative flex cursor-pointer flex-col rounded-3xl border bg-syntax-card p-6 hover:-translate-y-0.5 ${
        isHighlighted
          ? 'border-syntax-accent ring-2 ring-syntax-accent/30'
          : 'border-syntax-border hover:border-syntax-accent/40 hover:shadow-[var(--syntax-glow)]'
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
      <span className="pointer-events-none absolute right-6 top-6 text-[11px] tabular-nums text-syntax-muted">
        {snippet.updatedAt}
      </span>

      <div className="mb-4 pr-16">
        <div className="flex items-start gap-4">
          <NestedTechIcons
            language={snippet.language}
            primaryTech={snippet.primaryTech}
            size="lg"
          />

          <h3 className="line-clamp-2 min-w-0 flex-1 pt-1 text-base font-semibold leading-snug text-syntax-text">
            {snippet.title}
          </h3>
        </div>
      </div>

      {snippet.previewLine.trim() ? (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-syntax-muted">
          {snippet.previewLine}
        </p>
      ) : null}

      <CodeBlock
        className="mb-5"
        code={snippet.code}
        language={snippet.language}
        maxLines={4}
        showLanguageLabel
        size="md"
      />
    </article>
  );
}
