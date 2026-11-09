import type { MixedContentAnalysisResult, PageContext } from '../types/context';
import { getLocale } from '../storage/localeStorage';
import { resolveNoteTechnology } from '../utils/pageContextTechDetection';
import {
  AiServiceError,
  normalizeTopics,
  postAiRequest,
  readAiHttpErrorMessage,
} from './aiService';

interface RawMixedContentAnalysisResult {
  suggestedTitle: string;
  formattedNote: string;
  primaryCode: string;
  language: string;
  /** Added by newer API versions; older ones only return `language`. */
  primaryTech?: string;
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
    preferredPrimaryTech:
      typeof raw.primaryTech === 'string' ? raw.primaryTech.trim().toLowerCase() : undefined,
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

export async function analyzeMixedPageContextWithAI(
  pageContext: PageContext,
): Promise<MixedContentAnalysisResult> {
  const locale = await getLocale();
  const response = await postAiRequest('/api/v1/ai/analyze-mixed', {
    locale,
    pageContext,
  });

  if (!response.ok) {
    throw new AiServiceError(await readAiHttpErrorMessage(response));
  }

  const payload = (await response.json()) as AnalyzeMixedApiResponse;

  if (!isRawMixedContentAnalysisResult(payload.result)) {
    throw new AiServiceError(
      'AI could not structure the selection. Edit fields manually and save.',
    );
  }

  return normalizeMixedContentResult(payload.result, pageContext);
}
