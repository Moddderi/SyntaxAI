import { useCallback, useState, type MouseEvent, type ReactElement } from 'react';
import { StarIcon, TrashIcon } from './icons';

const COPY_FEEDBACK_MS = 2000;

interface SnippetQuickActionsProps {
  snippetId: string;
  code: string;
  isStarred: boolean;
  onToggleStar: (id: string) => void;
  onRequestDelete: (id: string) => void;
  variant?: 'floating' | 'inline';
  className?: string;
}

export function SnippetQuickActions({
  snippetId,
  code,
  isStarred,
  onToggleStar,
  onRequestDelete,
  variant = 'floating',
  className = '',
}: SnippetQuickActionsProps): ReactElement {
  const [isCopied, setIsCopied] = useState(false);

  const stopPropagation = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
  };

  const handleCopyCode = useCallback(
    async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
      stopPropagation(event);

      try {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), COPY_FEEDBACK_MS);
      } catch {
        setIsCopied(false);
      }
    },
    [code],
  );

  const containerClass =
    variant === 'floating'
      ? 'absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-[#1c1c20] bg-[#0d0d0f]/95 p-1 opacity-0 shadow-lg backdrop-blur-sm transition group-hover:opacity-100'
      : 'flex shrink-0 items-center gap-1';

  return (
    <div className={`${containerClass} ${className}`.trim()}>
      <div className="relative">
        <button
          aria-label={isCopied ? 'Code copied' : 'Copy code'}
          className="rounded-full p-1.5 text-sm text-gray-400 transition hover:bg-[#141417] hover:text-[#00eaff]"
          onClick={(event) => void handleCopyCode(event)}
          type="button"
        >
          {isCopied ? '✓' : '📋'}
        </button>
        {isCopied && variant === 'floating' ? (
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#00eaff] px-2 py-0.5 text-[10px] font-semibold text-black">
            Copied!
          </span>
        ) : null}
      </div>

      <button
        aria-label={isStarred ? 'Remove from starred' : 'Add to starred'}
        className="rounded-full p-1.5 text-gray-400 transition hover:bg-[#141417] hover:text-[#00eaff]"
        onClick={(event) => {
          stopPropagation(event);
          onToggleStar(snippetId);
        }}
        type="button"
      >
        <StarIcon
          className={`h-4 w-4 ${isStarred ? 'text-[#00eaff]' : ''}`}
          filled={isStarred}
        />
      </button>

      <button
        aria-label="Delete note"
        className="rounded-full p-1.5 text-gray-400 transition hover:bg-[#141417] hover:text-red-400"
        onClick={(event) => {
          stopPropagation(event);
          onRequestDelete(snippetId);
        }}
        type="button"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
