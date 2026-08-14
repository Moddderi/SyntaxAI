import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { NoteForm } from '../../components/NoteForm';
import { UpgradeLimitBanner } from '../../components/UpgradeLimitBanner';
import { useCaptureSettings } from '../../hooks/useCaptureSettings';
import { useNotes } from '../../hooks/useNotes';
import { useTranslation } from '../../hooks/useTranslation';
import { saveNote } from '../../storage/notesStorage';
import type { PageContext } from '../../types/context';
import { resolveCaptureContent } from '../../utils/captureContent';
import { buildNoteFromCapture } from '../../utils/noteHelpers';
import { buildPlainTextPreview } from '../../utils/markdownPreview';
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
  const { t } = useTranslation();
  const includeContextDescription = captureSettings.includeContextDescription;
  const enablePasteCapture = captureSettings.enablePasteCapture;
  const enableContextCapture = captureSettings.enableContextCapture;
  const [isSaving, setIsSaving] = useState(false);
  const [limitState, setLimitState] = useState<{
    limitId: UsageLimitId;
    message: string;
  } | null>(null);
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
    if (!includeContextDescription) {
      setNoteBody('');
    }
  }, [includeContextDescription]);

  useEffect(() => {
    if (!contextAnalysis) {
      return;
    }

    if (includeContextDescription) {
      setNoteBody(contextAnalysis.formattedNote);
    }

    setNoteCode(sanitizeCapturedCode(contextAnalysis.primaryCode));
    setEditedTitle(contextAnalysis.suggestedTitle);
  }, [contextAnalysis, includeContextDescription, setEditedTitle]);

  const handleContextCapture = useCallback(
    (pageContext: PageContext): void => {
      if (!enableContextCapture) {
        return;
      }

      const contextLimit = includeContextDescription
        ? checkCanRunContextAnalysis(notes)
        : { allowed: true, limitId: null, message: null };
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
        includeContextDescription,
      );

      setPageContextSource(pageContext);
      setNoteBody(initialBody);
      setNoteCode(initialCode);
      setEditedTitle(buildFallbackTitle(pageContext));
      void runPageContextAnalysis(pageContext);
    },
    [
      clearImages,
      enableContextCapture,
      includeContextDescription,
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
          summary: analysis.summary,
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
    Boolean(noteCode.trim() || (includeContextDescription && noteBody.trim())) &&
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
      isContextCaptureMode && includeContextDescription && noteBody.trim().length > 0;
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
    setIsSaving(true);

    try {
      if (isContextCaptureMode && pageContextSource) {
        const title =
          editedTitle.trim() ||
          contextAnalysis?.suggestedTitle ||
          buildFallbackTitle(pageContextSource);

        const savedBody = includeContextDescription ? noteBody.trim() : '';
        const summarySource = includeContextDescription
          ? buildPlainTextPreview(noteBody, contextAnalysis?.formattedNote)
          : editedTitle.trim() || contextAnalysis?.suggestedTitle;

        const note = buildNoteFromCapture(
          noteCode.trim(),
          {
            title,
            primaryTech: contextPrimaryTech,
            language: contextLanguage,
            topics: contextAnalysis?.tags ?? [],
            code: noteCode.trim(),
            summary: summarySource || undefined,
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
    includeContextDescription,
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
      {!isContextCaptureMode && enablePasteCapture ? (
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
      ) : !isContextCaptureMode ? (
        <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-syntax-text">{t('sidePanelPasteDisabledTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-syntax-muted">
            {t('sidePanelPasteDisabledDesc')}
          </p>
        </div>
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
          showContextBody={includeContextDescription}
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
          disabled={!canSave}
          isSaving={isSaving}
          onClick={() => {
            void handleSave();
          }}
        />
      </div>

      <div className="mt-auto shrink-0 border-t border-syntax-border pt-3">
        <RecentNotesSection onOpenNoteDetail={onOpenNoteDetail} />
      </div>
    </div>
  );
}
