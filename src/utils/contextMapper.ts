import type {
  AIAnalyzedContext,
  DraftNoteFromContext,
  MixedContentAnalysisResult,
  PageContext,
} from '../types/context';
import type { AnalyzeSnippetResult } from '../services/aiService';
import { getNotePreviewLine } from './noteHelpers';

export function toAIAnalyzedContext(result: AnalyzeSnippetResult): AIAnalyzedContext {
  return {
    suggestedTitle: result.title,
    tags: result.topics,
    summary: result.summary,
    language: result.language,
  };
}

export function toDraftNoteFromMixedContent(
  pageContext: PageContext,
  result: MixedContentAnalysisResult,
): DraftNoteFromContext {
  return {
    title: result.suggestedTitle,
    code: result.primaryCode,
    body: result.formattedNote,
    tags: result.tags,
    sourceUrl: pageContext.url,
    aiSummary: getNotePreviewLine(result.formattedNote, result.primaryCode),
    language: result.language,
    primaryTech: result.primaryTech,
  };
}

export function toDraftNoteFromContext(
  pageContext: PageContext,
  result: AnalyzeSnippetResult,
): DraftNoteFromContext {
  return {
    title: result.title,
    code: result.code,
    body: result.summary,
    tags: result.topics,
    sourceUrl: pageContext.url,
    aiSummary: result.summary,
    language: result.language,
    primaryTech: result.primaryTech,
  };
}
