import type { MixedContentAnalysisResult, PageContext } from '../types/context';
import { getLocale } from '../storage/localeStorage';
import { resolveNoteTechnology } from '../utils/pageContextTechDetection';
import { apiFetchAuthed } from './apiClient';
import { AiServiceError, normalizeTopics } from './aiService';

interface RawMixedContentAnalysisResult {
  suggestedTitle: string;
  formattedNote: string;
  primaryCode: string;
  language: string;
  tags: string[];
}

interface AnalyzeMixedApiResponse {
  result?: RawMixedContentAnalysisResult;
  error?: string;
}

function isRawMixedContentAnalysisResult(
  value: unknown,
): value is RawMixedContentAnalysisResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.suggestedTitle === 'string' &&
    typeof record.formattedNote === 'string' &&
    typeof record.primaryCode === 'string' &&
    typeof record.language === 'string' &&
    Array.isArray(record.tags) &&
    record.tags.every((tag) => typeof tag === 'string')
  );
}

function normalizeMixedContentResult(
  raw: RawMixedContentAnalysisResult,
  pageContext: PageContext,
): MixedContentAnalysisResult {
  const primaryCode = raw.primaryCode.trim();
  const formattedNote = raw.formattedNote.trim();
  const resolvedTech = resolveNoteTechnology({
    title: raw.suggestedTitle,
    code: primaryCode,
    body: formattedNote,
    sourceUrl: pageContext.url,
    language: raw.language.trim().toLowerCase(),
  });

  const suggestedTitle =
    raw.suggestedTitle.trim() ||
    pageContext.pageTitle.trim() ||
    'Captured note';

  return {
    suggestedTitle,
    formattedNote,
    primaryCode,
    language: resolvedTech.language,
    tags: normalizeTopics(raw.tags),
    primaryTech: resolvedTech.primaryTech,
  };
}

async function readAiErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) {
    return 'Sign in to SyntaxAI to use AI analysis.';
  }

  if (response.status === 503) {
    return 'AI is temporarily unavailable. Try again later.';
  }

  try {
    const payload = (await response.json()) as AnalyzeMixedApiResponse;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // fall through
  }

  return `AI request failed with status ${response.status}.`;
}

export async function analyzeMixedPageContextWithAI(
  pageContext: PageContext,
): Promise<MixedContentAnalysisResult> {
  const locale = await getLocale();
  const response = await apiFetchAuthed('/api/v1/ai/analyze-mixed', {
    method: 'POST',
    body: JSON.stringify({
      locale,
      pageContext,
    }),
  });

  if (!response.ok) {
    throw new AiServiceError(await readAiErrorMessage(response));
  }

  const payload = (await response.json()) as AnalyzeMixedApiResponse;

  if (!isRawMixedContentAnalysisResult(payload.result)) {
    throw new AiServiceError(
      'AI could not structure the selection. Edit fields manually and save.',
    );
  }

  return normalizeMixedContentResult(payload.result, pageContext);
}
