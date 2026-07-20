import type { ReactElement } from 'react';
import { useCaptureInput } from '../hooks/useCaptureInput';
import type { DetectedNote } from '../types/capture.types';
import { CaptureTextArea } from './CaptureTextArea';
import { DetectedNoteBlock } from './DetectedNoteBlock';
import { RecentNotesSection } from './RecentNotesSection';
import { SaveToLibraryButton } from './SaveToLibraryButton';

const MOCK_DETECTED_NOTE: DetectedNote = {
  technologyLabel: 'TS',
  title: 'Prisma findFirst with include',
  tags: ['#prisma', '#db', '#auth'],
};

export function CaptureView(): ReactElement {
  const capture = useCaptureInput();

  const handleSave = (): void => {
    console.info('[SyntaxAI] Save to library', {
      text: capture.text,
      imageCount: capture.pastedImages.length,
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <CaptureTextArea
        isDragging={capture.isDragging}
        onDragLeave={capture.handleDragLeave}
        onDragOver={capture.handleDragOver}
        onDrop={capture.handleDrop}
        onPaste={capture.handlePaste}
        onRemoveImage={capture.removeImage}
        onTextChange={capture.setText}
        pastedImages={capture.pastedImages}
        text={capture.text}
      />

      <DetectedNoteBlock note={MOCK_DETECTED_NOTE} />

      <SaveToLibraryButton onClick={handleSave} />

      <div className="mt-auto shrink-0 border-t border-syntax-border pt-3">
        <RecentNotesSection />
      </div>
    </div>
  );
}
