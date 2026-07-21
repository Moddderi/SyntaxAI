import type { ReactElement } from 'react';

interface SaveToLibraryButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export function SaveToLibraryButton({
  onClick,
  disabled = false,
  isSaving = false,
}: SaveToLibraryButtonProps): ReactElement {
  return (
    <button
      className="h-12 w-full rounded-full bg-syntax-accent font-semibold text-black transition hover:bg-syntax-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {isSaving ? 'Saving…' : 'Save to library'}
    </button>
  );
}
