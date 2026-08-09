import type { PageContext } from '../types/context';
import { extractPrimaryCodeFromMarkdown, sanitizeCapturedCode } from './selectionFormatter';

export interface ResolvedCaptureContent {
  noteBody: string;
  noteCode: string;
}

export function resolveCaptureContent(
  pageContext: PageContext,
  includeContextDescription: boolean,
): ResolvedCaptureContent {
  const rawContent = pageContext.rawContent.trim() || pageContext.selectedText.trim();
  const extractedCode = sanitizeCapturedCode(extractPrimaryCodeFromMarkdown(rawContent));

  if (!includeContextDescription) {
    return {
      noteBody: '',
      noteCode: extractedCode || sanitizeCapturedCode(rawContent),
    };
  }

  return {
    noteBody: rawContent,
    noteCode: extractedCode,
  };
}
