import { useCallback, useState, type ReactElement } from 'react';
import { saveNote } from '../../storage/notesStorage';
import { buildNoteFromCapture } from '../../utils/noteHelpers';
import { useCaptureInput } from '../hooks/useCaptureInput';
import { useSnippetAnalysis } from '../hooks/useSnippetAnalysis';
import { CaptureTextArea } from './CaptureTextArea';
import { DetectedNoteBlock } from './DetectedNoteBlock';
import { RecentNotesSection } from './RecentNotesSection';
import { SaveToLibraryButton } from './SaveToLibraryButton';

interface CaptureViewProps {
  onOpenNoteDetail: (noteId: string) => void;
}

export function CaptureView({ onOpenNoteDetail }: CaptureViewProps): ReactElement {
  const capture = useCaptureInput();
  const [isSaving, setIsSaving] = useState(false);
  const { text, reset, pastedImages, setText } = capture;

  const {
    analysis,
    editedTitle,
    setEditedTitle,
    isAnalyzing,
    error,
    runAnalysis,
    resetAnalysis,
  } = useSnippetAnalysis(text, pastedImages);

  const hasInput = Boolean(text.trim()) || pastedImages.length > 0;
  const canDetect = hasInput && !isAnalyzing;

  const detectedNote =
    analysis !== null
      ? {
          title: editedTitle.trim() || analysis.title,
          primaryTech: analysis.primaryTech,
          language: analysis.language,
          topics: analysis.topics,
          code: analysis.code,
          summary: analysis.summary,
        }
      : null;

  const resolvedCode = analysis?.code.trim() || text.trim();
  const canSave = Boolean(resolvedCode) && Boolean(detectedNote) && !isAnalyzing && !isSaving;

  const handleDetect = useCallback((): void => {
    if (!canDetect) {
      return;
    }

    void runAnalysis(text, pastedImages);
  }, [canDetect, pastedImages, runAnalysis, text]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!canSave || !detectedNote) {
      return;
    }

    setIsSaving(true);

    try {
      const sourceType = pastedImages.length > 0 ? 'image' : 'code';
      const note = buildNoteFromCapture(
        resolvedCode,
        {
          ...detectedNote,
          title: editedTitle.trim() || detectedNote.title,
        },
        sourceType,
      );

      await saveNote(note);
      reset();
      resetAnalysis();
    } finally {
      setIsSaving(false);
    }
  }, [canSave, detectedNote, editedTitle, pastedImages.length, reset, resetAnalysis, resolvedCode]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <CaptureTextArea
        canDetect={canDetect}
        isAnalyzing={isAnalyzing}
        isDragging={capture.isDragging}
        onDetect={handleDetect}
        onDragLeave={capture.handleDragLeave}
        onDragOver={capture.handleDragOver}
        onDrop={capture.handleDrop}
        onPaste={capture.handlePaste}
        onRemoveImage={capture.removeImage}
        onTextChange={setText}
        pastedImages={capture.pastedImages}
        text={capture.text}
      />

      <DetectedNoteBlock
        error={error}
        isAnalyzing={isAnalyzing}
        note={detectedNote}
        onTitleChange={setEditedTitle}
        title={editedTitle}
      />

      <SaveToLibraryButton
        disabled={!canSave}
        isSaving={isSaving}
        onClick={() => {
          void handleSave();
        }}
      />

      <div className="mt-auto shrink-0 border-t border-syntax-border pt-3">
        <RecentNotesSection onOpenNoteDetail={onOpenNoteDetail} />
      </div>
    </div>
  );
}
