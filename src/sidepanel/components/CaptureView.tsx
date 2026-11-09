import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { NoteForm } from '../../components/NoteForm';
import { UpgradeLimitBanner } from '../../components/UpgradeLimitBanner';
import { useCaptureSettings } from '../../hooks/useCaptureSettings';
import { useNotes } from '../../hooks/useNotes';
import { saveNote } from '../../storage/notesStorage';
import type { PageContext } from '../../types/context';
import {
  buildFallbackTitle,
  resolveCaptureContent,
  resolveContextCaptureTitle,
} from '../../utils/captureContent';
import { buildNoteFromCapture } from '../../utils/noteHelpers';
import { resolveContextCaptureTech } from '../../utils/pageContextTechDetection';
import { sanitizeCapturedCode } from '../../utils/selectionFormatter';
import {
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from '../../utils/techDetection';
import {
  checkCanRunContextAnalysis,
  checkCanRunPhotoAnalysis,
  checkCanSaveNote,
  type UsageLimitCheck,
  type UsageLimitId,
} from '../../utils/usageLimits';
import { useCaptureInput } from '../hooks/useCaptureInput';
import { useContextCaptureDraft } from '../hooks/useContextCaptureDraft';
import { useSnippetAnalysis } from '../hooks/useSnippetAnalysis';
import { CaptureTextArea } from './CaptureTextArea';
import { DetectedNoteBlock } from './DetectedNoteBlock';
import { RecentNotesSection } from './RecentNotesSection';
import { SaveToLibraryButton, type SaveButtonStatus } from './SaveToLibraryButton';

interface CaptureViewProps {
  onOpenNoteDetail: (noteId: string) => void;
  onContextCaptureStart?: () => void;
}

function toLimitState(check: UsageLimitCheck): {
  limitId: UsageLimitId;
  message: string;
} | null {
  if (check.allowed || !check.limitId) {
    return null;
  }

  return {
    limitId: check.limitId,
    message: check.message ?? '',
  };
}

export function CaptureView({
  onOpenNoteDetail,
  onContextCaptureStart,
}: CaptureViewProps): ReactElement {
  const capture = useCaptureInput();
  const { notes } = useNotes();
  const { settings: captureSettings } = useCaptureSettings();
  const aiAddsContext = captureSettings.enableContextCapture;
  const aiPasteExplanations = captureSettings.enablePasteExplanations;
  const [saveStatus, setSaveStatus] = useState<SaveButtonStatus>('idle');
  const saveResetTimerRef = useRef<number | null>(null);
  const [limitState, setLimitState] = useState<{
    limitId: UsageLimitId;
    message: string;
  } | null>(null);
  const [pageContextSource, setPageContextSource] = useState<PageContext | null>(null);
  const [noteBody, setNoteBody] = useState('');
  const [noteCode, setNoteCode] = useState('');
  const { text, reset, clearImages, pastedImages } = capture;
  const isSaving = saveStatus === 'saving';

  useEffect(() => {
    return () => {
      if (saveResetTimerRef.current !== null) {
        window.clearTimeout(saveResetTimerRef.current);
      }
    };
  }, []);

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
    if (!contextAnalysis || !pageContextSource) {
      return;
    }

    setNoteBody(aiAddsContext ? contextAnalysis.formattedNote : '');

    const aiCode = sanitizeCapturedCode(contextAnalysis.primaryCode);
    if (aiCode) {
      setNoteCode(aiCode);
    }

    setEditedTitle((prev) =>
      resolveContextCaptureTitle(pageContextSource, prev, contextAnalysis.suggestedTitle),
    );
  }, [aiAddsContext, contextAnalysis, pageContextSource, setEditedTitle]);

  const handleContextCapture = useCallback(
    (pageContext: PageContext): void => {
      const contextLimit = checkCanRunContextAnalysis(notes);
      const blocked = toLimitState(contextLimit);

      if (blocked) {
        setLimitState(blocked);
        return;
      }

      setLimitState(null);
      onContextCaptureStart?.();
      clearImages();
      resetAnalysis();

      const { noteBody: initialBody, noteCode: initialCode } = resolveCaptureContent(
        pageContext,
        aiAddsContext,
      );

      setPageContextSource(pageContext);
      setNoteBody(initialBody);
      setNoteCode(initialCode);
      setEditedTitle(buildFallbackTitle(pageContext));
      void runPageContextAnalysis(pageContext);
    },
    [
      aiAddsContext,
      clearImages,
      notes,
      onContextCaptureStart,
      resetAnalysis,
      runPageContextAnalysis,
    ],
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
          summary: aiPasteExplanations ? analysis.summary : undefined,
        }
      : null;

  const resolvedContextTech = pageContextSource
    ? resolveContextCaptureTech(
        pageContextSource,
        noteCode,
        noteBody,
        contextAnalysis,
        editedTitle,
      )
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
        title: resolveContextCaptureTitle(
          pageContextSource,
          editedTitle,
          contextAnalysis?.suggestedTitle,
        ),
        noteBody,
        code: noteCode,
        language: contextLanguage,
        primaryTech: contextPrimaryTech,
        tags: contextAnalysis?.tags ?? [],
      }
    : null;

  const canSaveContext =
    isContextCaptureMode &&
    Boolean(noteCode.trim() || (aiAddsContext && noteBody.trim())) &&
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

    if (pastedImages.length > 0) {
      const photoLimit = checkCanRunPhotoAnalysis(notes);
      const blocked = toLimitState(photoLimit);

      if (blocked) {
        setLimitState(blocked);
        return;
      }
    }

    setLimitState(null);
    setPageContextSource(null);
    setNoteBody('');
    setNoteCode('');
    void runAnalysis(text, pastedImages);
  }, [canDetect, notes, pastedImages, runAnalysis, text]);

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

    const includesContextBody =
      isContextCaptureMode && aiAddsContext && noteBody.trim().length > 0;
    const isPhotoSource = !isContextCaptureMode && pastedImages.length > 0;
    const saveLimit = checkCanSaveNote(notes, {
      includesContextBody,
      isPhotoSource,
    });
    const blocked = toLimitState(saveLimit);

    if (blocked) {
      setLimitState(blocked);
      return;
    }

    setLimitState(null);
    if (saveResetTimerRef.current !== null) {
      window.clearTimeout(saveResetTimerRef.current);
      saveResetTimerRef.current = null;
    }
    setSaveStatus('saving');

    try {
      if (isContextCaptureMode && pageContextSource) {
        const title = resolveContextCaptureTitle(
          pageContextSource,
          editedTitle,
          contextAnalysis?.suggestedTitle,
        );

        const savedBody = aiAddsContext ? noteBody.trim() : '';

        const note = buildNoteFromCapture(
          noteCode.trim(),
          {
            title,
            primaryTech: contextPrimaryTech,
            language: contextLanguage,
            topics: contextAnalysis?.tags ?? [],
            code: noteCode.trim(),
          },
          'tab',
          pageContextSource.url,
          savedBody || undefined,
        );

        await saveNote(note);
      } else if (detectedNote) {
        const sourceType = pastedImages.length > 0 ? 'image' : 'code';
        const note = buildNoteFromCapture(
          detectedNote.code.trim() || text.trim(),
          {
            ...detectedNote,
            title: editedTitle.trim() || detectedNote.title,
            summary: aiPasteExplanations ? detectedNote.summary : undefined,
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
      setSaveStatus('saved');
      saveResetTimerRef.current = window.setTimeout(() => {
        setSaveStatus('idle');
        saveResetTimerRef.current = null;
      }, 1400);
    } catch {
      setSaveStatus('idle');
    }
  }, [
    canSave,
    aiAddsContext,
    aiPasteExplanations,
    contextAnalysis,
    contextLanguage,
    contextPrimaryTech,
    detectedNote,
    editedTitle,
    isContextCaptureMode,
    noteBody,
    noteCode,
    notes,
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

      {limitState ? (
        <UpgradeLimitBanner limitId={limitState.limitId} message={limitState.message} />
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
          showContextBody={aiAddsContext}
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

      <div className="relative z-20 shrink-0">
        <SaveToLibraryButton
          disabled={!canSave && saveStatus === 'idle'}
          onClick={() => {
            void handleSave();
          }}
          status={saveStatus}
        />
      </div>

      <div className="mt-auto shrink-0 border-t border-syntax-border pt-3">
        <RecentNotesSection onOpenNoteDetail={onOpenNoteDetail} />
      </div>
    </div>
  );
}
