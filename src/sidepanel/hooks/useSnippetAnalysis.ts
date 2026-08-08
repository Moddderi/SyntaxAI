import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeMixedPageContextWithAI } from '../../services/contextAiService';
import { analyzeSnippetWithAI, AiServiceError } from '../../services/aiService';
import type { AnalyzeSnippetResult } from '../../services/aiService';
import type { MixedContentAnalysisResult, PageContext } from '../../types/context';
import { filesToDataUrls } from '../../utils/imageToDataUrl';
import type { PastedImage } from '../types/capture.types';

interface UseSnippetAnalysisResult {
  analysis: AnalyzeSnippetResult | null;
  contextAnalysis: MixedContentAnalysisResult | null;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  isAnalyzing: boolean;
  error: string | null;
  runAnalysis: (promptOrCode: string, pastedImages: PastedImage[]) => Promise<void>;
  runPageContextAnalysis: (pageContext: PageContext) => Promise<void>;
  resetAnalysis: () => void;
}

function buildInputSnapshot(promptOrCode: string, pastedImages: PastedImage[]): string {
  return `${promptOrCode.trim()}::${pastedImages.map((image) => image.id).join(',')}`;
}

export function useSnippetAnalysis(
  promptOrCode: string,
  pastedImages: PastedImage[],
): UseSnippetAnalysisResult {
  const [analysis, setAnalysis] = useState<AnalyzeSnippetResult | null>(null);
  const [contextAnalysis, setContextAnalysis] = useState<MixedContentAnalysisResult | null>(
    null,
  );
  const [editedTitle, setEditedTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const analyzedSnapshotRef = useRef('');
  const activeContextSnapshotRef = useRef<string | null>(null);

  const resetAnalysis = useCallback((): void => {
    requestIdRef.current += 1;
    analyzedSnapshotRef.current = '';
    activeContextSnapshotRef.current = null;
    setAnalysis(null);
    setContextAnalysis(null);
    setEditedTitle('');
    setIsAnalyzing(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (activeContextSnapshotRef.current) {
      return;
    }

    const trimmedPrompt = promptOrCode.trim();
    const hasImages = pastedImages.length > 0;

    if (!trimmedPrompt && !hasImages) {
      resetAnalysis();
      return;
    }

    const snapshot = buildInputSnapshot(promptOrCode, pastedImages);

    if (analysis !== null && snapshot !== analyzedSnapshotRef.current) {
      requestIdRef.current += 1;
      setAnalysis(null);
      setEditedTitle('');
      setError(null);
      setIsAnalyzing(false);
    }
  }, [analysis, pastedImages, promptOrCode, resetAnalysis]);

  const runAnalysis = useCallback(
    async (inputPrompt: string, images: PastedImage[]): Promise<void> => {
      const trimmedPrompt = inputPrompt.trim();
      const hasImages = images.length > 0;

      if (!trimmedPrompt && !hasImages) {
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      activeContextSnapshotRef.current = null;

      setIsAnalyzing(true);
      setError(null);
      setContextAnalysis(null);

      try {
        const imagesBase64 = hasImages
          ? await filesToDataUrls(images.map((image) => image.file))
          : undefined;

        const result = await analyzeSnippetWithAI({
          promptOrCode: trimmedPrompt,
          imagesBase64,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        analyzedSnapshotRef.current = buildInputSnapshot(inputPrompt, images);
        setAnalysis(result);
        setEditedTitle(result.title);
      } catch (analysisError) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setAnalysis(null);

        if (analysisError instanceof AiServiceError) {
          setError(analysisError.message);
          return;
        }

        setError('Failed to analyze snippet. Please try again.');
      } finally {
        if (requestIdRef.current === requestId) {
          setIsAnalyzing(false);
        }
      }
    },
    [],
  );

  const runPageContextAnalysis = useCallback(async (pageContext: PageContext): Promise<void> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeContextSnapshotRef.current = `${pageContext.url}::${pageContext.rawContent}`;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setContextAnalysis(null);

    try {
      const result = await analyzeMixedPageContextWithAI(pageContext);

      if (requestIdRef.current !== requestId) {
        return;
      }

      setContextAnalysis(result);
      setEditedTitle(result.suggestedTitle);
    } catch (analysisError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      if (analysisError instanceof AiServiceError) {
        setError(analysisError.message);
        return;
      }

      setError('Failed to analyze page context. You can still edit and save manually.');
    } finally {
      if (requestIdRef.current === requestId) {
        setIsAnalyzing(false);
      }
    }
  }, []);

  return {
    analysis,
    contextAnalysis,
    editedTitle,
    setEditedTitle,
    isAnalyzing,
    error,
    runAnalysis,
    runPageContextAnalysis,
    resetAnalysis,
  };
}
