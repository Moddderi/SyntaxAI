import { useCallback, useState, type MouseEvent, type ReactElement } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { CopyIcon, StarIcon, TrashIcon } from './icons';

const COPY_FEEDBACK_MS = 2000;

const ACTION_BUTTON_CLASS =
  'flex h-7 w-7 items-center justify-center rounded-lg text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-accent';

interface SnippetQuickActionsProps {
  snippetId: string;
  code: string;
  isStarred: boolean;
  onToggleStar: (id: string) => void;
  onRequestDelete: (id: string) => void;
  showCopy?: boolean;
  className?: string;
}

export function SnippetQuickActions({
  snippetId,
  code,
  isStarred,
  onToggleStar,
  onRequestDelete,
  showCopy = false,
  className = '',
}: SnippetQuickActionsProps): ReactElement {
  const { t } = useTranslation();
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

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
      role="toolbar"
    >
      {showCopy ? (
        <button
          aria-label={isCopied ? t('snippetActionCopied') : t('snippetActionCopyCode')}
          className={ACTION_BUTTON_CLASS}
          onClick={(event) => void handleCopyCode(event)}
          type="button"
        >
          {isCopied ? (
            <span className="text-[10px] font-bold text-syntax-accent">✓</span>
          ) : (
            <CopyIcon className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}

      <button
        aria-label={isStarred ? t('snippetActionUnstar') : t('snippetActionStar')}
        className={`${ACTION_BUTTON_CLASS} ${isStarred ? 'text-syntax-accent' : ''}`}
        onClick={(event) => {
          stopPropagation(event);
          onToggleStar(snippetId);
        }}
        type="button"
      >
        <StarIcon className="h-3.5 w-3.5" filled={isStarred} />
      </button>

      <button
        aria-label={t('snippetActionDelete')}
        className={`${ACTION_BUTTON_CLASS} hover:text-red-400`}
        onClick={(event) => {
          stopPropagation(event);
          onRequestDelete(snippetId);
        }}
        type="button"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
