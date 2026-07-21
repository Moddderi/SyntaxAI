import type { ReactElement } from 'react';
import { TechIcon } from '../../components/TechIcon';
import type { SnippetItem } from '../types/dashboard.types';
import { StarIcon } from './icons';

interface SnippetCardProps {
  snippet: SnippetItem;
  onToggleStar: (id: string) => void;
}

export function SnippetCard({
  snippet,
  onToggleStar,
}: SnippetCardProps): ReactElement {
  return (
    <article className="flex flex-col rounded-2xl border border-[#1c1c20] bg-[#141417] p-4 transition hover:border-[#00eaff]/30">
      <div className="mb-3 flex items-start justify-between gap-2">
        <TechIcon size="md" tech={snippet.tech} />
        <button
          aria-label={snippet.isStarred ? 'Remove from starred' : 'Add to starred'}
          className="rounded-lg p-1 transition hover:bg-[#0d0d0f]"
          onClick={() => onToggleStar(snippet.id)}
          type="button"
        >
          <StarIcon
            className={snippet.isStarred ? 'text-[#00eaff]' : 'text-gray-600'}
            filled={snippet.isStarred}
          />
        </button>
      </div>

      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-white">{snippet.title}</h3>
        <span className="shrink-0 text-[11px] text-gray-500">{snippet.updatedAt}</span>
      </div>

      <pre className="mb-4 overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-300">
        {snippet.codePreview}
      </pre>

      <div className="mt-auto flex flex-wrap gap-2">
        {snippet.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[#1c1c20] bg-[#0d0d0f] px-2.5 py-1 text-[11px] text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
