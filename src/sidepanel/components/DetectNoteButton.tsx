import type { KeyboardEvent, ReactElement } from 'react';

interface DetectNoteButtonProps {
  disabled?: boolean;
  isAnalyzing?: boolean;
  onClick: () => void;
}

export function DetectNoteButton({
  disabled = false,
  isAnalyzing = false,
  onClick,
}: DetectNoteButtonProps): ReactElement {
  return (
    <button
      className="h-10 shrink-0 rounded-full border border-syntax-accent/40 bg-syntax-accent/10 px-4 text-xs font-semibold text-syntax-accent transition hover:border-syntax-accent hover:bg-syntax-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || isAnalyzing}
      onClick={onClick}
      type="button"
    >
      {isAnalyzing ? 'Detecting…' : 'Detect note'}
    </button>
  );
}

export function isDetectShortcut(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey);
}
