import type { ReactElement } from 'react';

interface SaveToLibraryButtonProps {
  onClick?: () => void;
}

export function SaveToLibraryButton({
  onClick,
}: SaveToLibraryButtonProps): ReactElement {
  return (
    <button
      className="h-12 w-full rounded-full bg-syntax-accent font-semibold text-black transition hover:bg-syntax-accent/90"
      onClick={onClick}
      type="button"
    >
      Save to library
    </button>
  );
}
