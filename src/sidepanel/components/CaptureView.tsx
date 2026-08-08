import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { NoteForm } from '../../components/NoteForm';
import { saveNote } from '../../storage/notesStorage';
import type { PageContext } from '../../types/context';
import { buildNoteFromCapture } from '../../utils/noteHelpers';
import { resolveContextCaptureTech } from '../../utils/pageContextTechDetection';
import { extractPrimaryCodeFromMarkdown } from '../../utils/selectionFormatter';
import {
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from '../../utils/techDetection';
import { useCaptureInput } from '../hooks/useCaptureInput';
import { useContextCaptureDraft } from '../hooks/useContextCaptureDraft';
import { useSnippetAnalysis } from '../hooks/useSnippetAnalysis';
import { CaptureTextArea } from './CaptureTextArea';
import { DetectedNoteBlock } from './DetectedNoteBlock';
import { RecentNotesSection } from './RecentNotesSection';
import { SaveToLibraryButton } from './SaveToLibraryButton';

interface CaptureViewProps {
  onOpenNoteDetail: (noteId: string) => void;
  onContextCaptureStart?: () => void;
}

function buildFallbackTitle(pageContext: PageContext): string {
  const fromPageTitle = pageContext.pageTitle.trim();

  if (fromPageTitle && fromPageTitle !== pageContext.url) {
    return fromPageTitle.length > 80 ? `${fromPageTitle.slice(0, 77)}…` : fromPageTitle;
  }

  const firstLine =
    pageContext.rawContent.split('\n').find((line) => line.trim().length > 0) ?? 'Captured note';

  return firstLine.replace(/^#+\s*/, '').slice(0, 80);
}

export function CaptureView({
  onOpenNoteDetail,
  onContextCaptureStart,
}: CaptureViewProps): ReactElement {
  const capture = useCaptureInput();
  const [isSaving, setIsSaving] = useState(false);
  const [pageContextSource, setPageContextSource] = useState<PageContext | null>(null);
  const [noteBody, setNoteBody] = useState('');
  const [noteCode, setNoteCode] = useState('');
  const { text, reset, clearImages, pastedImages } = capture;

  const {
    analysis,
    contextAnalysis,
    editedTitle,
    setEditedTitle,
    isAnalyzing,
    error,
    runAnalysis,
    runPageContextAnalysis,
    resetAnalysis,
  } = useSnippetAnalysis(text, pastedImages);

  useEffect(() => {
    if (!contextAnalysis) {
      return;
    }

    setNoteBody(contextAnalysis.formattedNote);
    setNoteCode(contextAnalysis.primaryCode);
    setEditedTitle(contextAnalysis.suggestedTitle);
  }, [contextAnalysis, setEditedTitle]);

  const handleContextCapture = useCallback(
    (pageContext: PageContext): void => {
      onContextCaptureStart?.();
      clearImages();
      resetAnalysis();

      const initialBody = pageContext.rawContent.trim() || pageContext.selectedText.trim();
      const initialCode = extractPrimaryCodeFromMarkdown(initialBody);

      setPageContextSource(pageContext);
      setNoteBody(initialBody);
      setNoteCode(initialCode);
      setEditedTitle(buildFallbackTitle(pageContext));
      void runPageContextAnalysis(pageContext);
    },
    [clearImages, onContextCaptureStart, resetAnalysis, runPageContextAnalysis],
  );

  useContextCaptureDraft({ onCapture: handleContextCapture });

  const isContextCaptureMode = pageContextSource !== null;
  const hasInput = Boolean(text.trim()) || pastedImages.length > 0;
  const canDetect = hasInput && !isAnalyzing && !isContextCaptureMode;

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

  const resolvedContextTech = pageContextSource
    ? resolveContextCaptureTech(pageContextSource, noteCode, noteBody, contextAnalysis)
    : null;

  const contextLanguage =
    resolvedContextTech?.language ??
    resolveBaseLanguage(noteCode || noteBody, 'javascript');

  const contextPrimaryTech =
    resolvedContextTech?.primaryTech ??
    resolvePrimaryTechnology(noteCode || noteBody, contextLanguage);

  const contextTechConfirmed = resolvedContextTech?.isConfirmed ?? false;

  const contextFormValues = pageContextSource
    ? {
        title: editedTitle,
        noteBody,
        code: noteCode,
        language: contextLanguage,
        primaryTech: contextPrimaryTech,
        tags: contextAnalysis?.tags ?? [],
      }
    : null;

  const canSaveContext =
    isContextCaptureMode &&
    Boolean(noteBody.trim() || noteCode.trim()) &&
    !isAnalyzing &&
    !isSaving;

  const canSaveManual =
    !isContextCaptureMode &&
    Boolean(analysis?.code.trim() || text.trim()) &&
    Boolean(detectedNote) &&
    !isAnalyzing &&
    !isSaving;

  const canSave = canSaveContext || canSaveManual;

  const handleDetect = useCallback((): void => {
    if (!canDetect) {
      return;
    }

    setPageContextSource(null);
    setNoteBody('');
    setNoteCode('');
    void runAnalysis(text, pastedImages);
  }, [canDetect, pastedImages, runAnalysis, text]);

  const handleCancelContextCapture = useCallback((): void => {
    setPageContextSource(null);
    setNoteBody('');
    setNoteCode('');
    resetAnalysis();
  }, [resetAnalysis]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      if (isContextCaptureMode && pageContextSource) {
        const title =
          editedTitle.trim() ||
          contextAnalysis?.suggestedTitle ||
          buildFallbackTitle(pageContextSource);

        const note = buildNoteFromCapture(
          noteCode.trim(),
          {
            title,
            primaryTech: contextPrimaryTech,
            language: contextLanguage,
            topics: contextAnalysis?.tags ?? [],
            code: noteCode.trim(),
            summary: noteBody.trim().slice(0, 280),
          },
          'tab',
          pageContextSource.url,
          noteBody.trim(),
        );

        await saveNote(note);
      } else if (detectedNote) {
        const sourceType = pastedImages.length > 0 ? 'image' : 'code';
        const note = buildNoteFromCapture(
          detectedNote.code.trim() || text.trim(),
          {
            ...detectedNote,
            title: editedTitle.trim() || detectedNote.title,
          },
          sourceType,
        );

        await saveNote(note);
      }

      setPageContextSource(null);
      setNoteBody('');
      setNoteCode('');
      reset();
      resetAnalysis();
    } finally {
      setIsSaving(false);
    }
  }, [
    canSave,
    contextAnalysis,
    contextLanguage,
    contextPrimaryTech,
    detectedNote,
    editedTitle,
    isContextCaptureMode,
    noteBody,
    noteCode,
    pageContextSource,
    pastedImages.length,
    reset,
    resetAnalysis,
    text,
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {!isContextCaptureMode ? (
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
          onTextChange={capture.setText}
          pastedImages={capture.pastedImages}
          text={capture.text}
        />
      ) : null}

      {isContextCaptureMode && contextFormValues ? (
        <NoteForm
          error={error}
          isAnalyzing={isAnalyzing}
          isTechConfirmed={contextTechConfirmed}
          onCancel={handleCancelContextCapture}
          onCodeChange={setNoteCode}
          onNoteBodyChange={setNoteBody}
          onTitleChange={setEditedTitle}
          sourceUrl={pageContextSource?.url}
          values={contextFormValues}
        />
      ) : (
        <DetectedNoteBlock
          error={error}
          isAnalyzing={isAnalyzing}
          note={detectedNote}
          onTitleChange={setEditedTitle}
          title={editedTitle}
        />
      )}

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
