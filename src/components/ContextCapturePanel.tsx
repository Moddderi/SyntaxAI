import type { ReactElement } from 'react';
import { CapturePanelLoader } from './CapturePanelLoader';
import { MarkdownContent } from './MarkdownContent';

interface ContextCapturePanelProps {
  content: string;
  isAnalyzing: boolean;
  isEditing: boolean;
  onContentChange: (value: string) => void;
}

export function ContextCapturePanel({
  content,
  isAnalyzing,
  isEditing,
  onContentChange,
}: ContextCapturePanelProps): ReactElement {
  if (isAnalyzing) {
    return <CapturePanelLoader label="Formatting context…" minHeightClass="min-h-[160px]" />;
  }

  if (isEditing || !content.trim()) {
    return (
      <textarea
        aria-label="Note body"
        className="min-h-[160px] w-full resize-y rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-3 py-3 font-mono text-xs leading-relaxed text-gray-300 outline-none transition placeholder:text-gray-500 focus:border-[#00eaff]/40"
        onChange={(event) => onContentChange(event.target.value)}
        placeholder="Rules, documentation, bullet points, and descriptions…"
        value={content}
      />
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-4 py-3">
      <MarkdownContent content={content} />
    </div>
  );
}
