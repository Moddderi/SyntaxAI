import type { ClipboardEvent, DragEvent, KeyboardEvent, ReactElement } from 'react';
import {
  CAPTURE_IMAGE_THUMB_GAP_PX,
  CAPTURE_IMAGE_THUMB_SIZE_PX,
  MAX_CAPTURE_IMAGES,
  type PastedImage,
} from '../types/capture.types';
import { isDetectShortcut } from './DetectNoteButton';
import { ImageDropIcon, SendIcon } from './icons';

const VISIBLE_THUMBS_WIDTH_PX =
  CAPTURE_IMAGE_THUMB_SIZE_PX * MAX_CAPTURE_IMAGES +
  CAPTURE_IMAGE_THUMB_GAP_PX * (MAX_CAPTURE_IMAGES - 1);

interface CaptureTextAreaProps {
  text: string;
  pastedImages: PastedImage[];
  isDragging: boolean;
  onTextChange: (value: string) => void;
  onRemoveImage: (id: string) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onDetect?: () => void;
  canDetect?: boolean;
  isAnalyzing?: boolean;
}

function RemoveImageIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function DetectSpinner(): ReactElement {
  return (
    <div
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black"
    />
  );
}

export function CaptureTextArea({
  text,
  pastedImages,
  isDragging,
  onTextChange,
  onRemoveImage,
  onDragOver,
  onDragLeave,
  onDrop,
  onPaste,
  onDetect,
  canDetect = false,
  isAnalyzing = false,
}: CaptureTextAreaProps): ReactElement {
  const hasImages = pastedImages.length > 0;
  const showDropHint = text.length === 0 && !hasImages;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!onDetect || !isDetectShortcut(event)) {
      return;
    }

    event.preventDefault();
    onDetect();
  };

  return (
    <section
      className={`relative min-h-[220px] rounded-2xl border border-dashed bg-syntax-bg transition-colors ${
        isDragging
          ? 'border-syntax-accent shadow-[0_0_0_1px_rgba(0,234,255,0.35)]'
          : 'border-syntax-border'
      }`}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <textarea
        aria-label="Note input"
        className={`min-h-[220px] w-full resize-none bg-transparent px-4 pt-4 font-mono text-[13px] leading-relaxed text-white outline-none placeholder:text-gray-500 ${
          hasImages ? 'pb-24' : 'pb-12'
        }`}
        onChange={(event) => onTextChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        placeholder="// Paste code, text, or drop an image..."
        spellCheck={false}
        value={text}
      />

      {showDropHint ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 text-center"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-syntax-accent/50 text-syntax-accent">
            <ImageDropIcon />
          </div>
          <p className="text-xs font-medium text-syntax-accent">
            Drag &amp; Drop Image
          </p>
          <p className="text-[11px] text-gray-400">or Paste image</p>
        </div>
      ) : null}

      {hasImages ? (
        <div
          className="absolute bottom-3 left-4 overflow-x-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(0,234,255,0.35)_transparent]"
          style={{ maxWidth: `min(${VISIBLE_THUMBS_WIDTH_PX}px, calc(100% - 6rem))` }}
        >
          <div className="flex w-max items-center gap-2">
            {pastedImages.map((image) => (
              <div key={image.id} className="relative shrink-0">
                <img
                  alt="Pasted note preview"
                  className="h-16 w-16 rounded-xl border border-syntax-accent/40 object-cover shadow-[0_0_16px_rgba(0,234,255,0.15)]"
                  src={image.previewUrl}
                />
                <button
                  aria-label="Remove pasted image"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-syntax-border bg-syntax-card text-gray-300 transition hover:border-syntax-accent/50 hover:bg-syntax-bg hover:text-syntax-accent"
                  onClick={() => onRemoveImage(image.id)}
                  type="button"
                >
                  <RemoveImageIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button
        aria-label="Detect note"
        className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full transition ${
          canDetect && !isAnalyzing
            ? 'bg-syntax-accent text-black shadow-[0_0_16px_rgba(0,234,255,0.35)] hover:bg-syntax-accent/90'
            : 'cursor-not-allowed border border-syntax-border bg-syntax-card text-gray-500'
        }`}
        disabled={!canDetect || isAnalyzing}
        onClick={onDetect}
        title="Detect note (⌘/Ctrl + Enter)"
        type="button"
      >
        {isAnalyzing ? <DetectSpinner /> : <SendIcon className="h-4 w-4" />}
      </button>
    </section>
  );
}
