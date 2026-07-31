import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeSnippetWithAI, AiServiceError } from '../../services/aiService';
import type { AnalyzeSnippetResult } from '../../services/aiService';
import { filesToDataUrls } from '../../utils/imageToDataUrl';
import type { PastedImage } from '../types/capture.types';

interface UseSnippetAnalysisResult {
  analysis: AnalyzeSnippetResult | null;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  isAnalyzing: boolean;
  error: string | null;
  runAnalysis: (promptOrCode: string, pastedImages: PastedImage[]) => Promise<void>;
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
  const [editedTitle, setEditedTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const analyzedSnapshotRef = useRef('');

  const resetAnalysis = useCallback((): void => {
    requestIdRef.current += 1;
    analyzedSnapshotRef.current = '';
    setAnalysis(null);
    setEditedTitle('');
    setIsAnalyzing(false);
    setError(null);
  }, []);

  useEffect(() => {
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

      setIsAnalyzing(true);
      setError(null);

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

  return {
    analysis,
    editedTitle,
    setEditedTitle,
    isAnalyzing,
    error,
    runAnalysis,
    resetAnalysis,
  };
}
