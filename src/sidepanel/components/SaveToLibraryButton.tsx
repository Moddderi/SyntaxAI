import type { ReactElement } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export type SaveButtonStatus = 'idle' | 'saving' | 'saved';

interface SaveToLibraryButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  status?: SaveButtonStatus;
}

export function SaveToLibraryButton({
  onClick,
  disabled = false,
  status = 'idle',
}: SaveToLibraryButtonProps): ReactElement {
  const { t } = useTranslation();
  const isSaving = status === 'saving';
  const isSaved = status === 'saved';
  const isInactive = disabled && !isSaving && !isSaved;

  const label = isSaving
    ? t('sidePanelSaving')
    : isSaved
      ? t('sidePanelSaved')
      : t('sidePanelSaveToLibrary');

  return (
    <button
      aria-busy={isSaving}
      className={
        isSaved
          ? 'syntax-focus-ring flex h-12 w-full items-center justify-center rounded-full border border-syntax-accent/35 bg-syntax-accent/10 font-mono text-sm font-bold uppercase tracking-wide text-syntax-accent'
          : isInactive
            ? 'syntax-focus-ring flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full border border-syntax-border bg-syntax-card font-mono text-sm font-bold uppercase tracking-wide text-syntax-muted'
            : 'syntax-btn-primary syntax-focus-ring h-12 w-full disabled:cursor-not-allowed disabled:opacity-50'
      }
      disabled={disabled || isSaving || isSaved}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
