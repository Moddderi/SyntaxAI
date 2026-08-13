import { useEffect, type ReactElement } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  noteTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  noteTitle,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps): ReactElement | null {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-syntax-overlay p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        aria-labelledby="confirm-delete-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-syntax-border bg-syntax-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className="text-lg font-semibold text-syntax-text" id="confirm-delete-title">
          Delete note?
        </h2>
        <p className="mt-2 text-sm text-syntax-muted">
          Are you sure you want to delete{' '}
          <span className="font-medium text-syntax-muted">&ldquo;{noteTitle}&rdquo;</span>? It will
          move to Trash.
        </p>

        <div className="mt-6 flex items-center gap-2">
          <button
            className="h-10 flex-1 rounded-full border border-syntax-border text-sm text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-text"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-10 flex-1 rounded-full bg-red-500/90 text-sm font-semibold text-syntax-text transition hover:bg-red-500"
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
