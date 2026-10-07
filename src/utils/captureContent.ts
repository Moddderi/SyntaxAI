import type { PageContext } from '../types/context';
import { extractPrimaryCodeFromMarkdown, sanitizeCapturedCode } from './selectionFormatter';

export function buildFallbackTitle(pageContext: PageContext): string {
  const fromPageTitle = pageContext.pageTitle.trim();

  if (fromPageTitle && fromPageTitle !== pageContext.url) {
    return fromPageTitle.length > 80 ? `${fromPageTitle.slice(0, 77)}…` : fromPageTitle;
  }

  const firstLine =
    pageContext.rawContent.split('\n').find((line) => line.trim().length > 0) ??
    pageContext.selectedText.split('\n').find((line) => line.trim().length > 0) ??
    'Captured note';

  const cleaned = firstLine.replace(/^#+\s*/, '').replace(/^```[\w-]*\s*$/, '').trim();

  if (cleaned.length > 0 && !cleaned.startsWith('```')) {
    return cleaned.slice(0, 80);
  }

  return 'Captured note';
}

/** Title is always resolved; the context toggle only affects body/explanations. */
export function resolveContextCaptureTitle(
  pageContext: PageContext,
  editedTitle: string,
  suggestedTitle?: string | null,
): string {
  const fromEdited = editedTitle.trim();
  if (fromEdited) {
    return fromEdited;
  }

  const fromAi = suggestedTitle?.trim();
  if (fromAi) {
    return fromAi;
  }

  return buildFallbackTitle(pageContext);
}

export interface ResolvedCaptureContent {
  noteBody: string;
  noteCode: string;
}

export function resolveCaptureContent(
  pageContext: PageContext,
  aiAddsContext: boolean,
): ResolvedCaptureContent {
  const rawContent = pageContext.rawContent.trim() || pageContext.selectedText.trim();
  const extractedCode = sanitizeCapturedCode(extractPrimaryCodeFromMarkdown(rawContent));

  if (!aiAddsContext) {
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
