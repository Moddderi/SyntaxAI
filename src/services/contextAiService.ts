import type { MixedContentAnalysisResult, PageContext } from '../types/context';
import { getLocale, type Locale } from '../storage/localeStorage';
import {
  buildMixedContentSystemPrompt,
  buildMixedContentUserPrompt,
} from '../utils/aiLocalePrompts';
import { resolveNoteTechnology } from '../utils/pageContextTechDetection';
import {
  ensureOpenAiApiKeyLoaded,
  getOpenAiApiKey,
  OPENAI_API_KEY_ENV_HINT,
} from './apiKeyStorage';
import { AiServiceError, normalizeTopics } from './aiService';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

interface RawMixedContentAnalysisResult {
  suggestedTitle: string;
  formattedNote: string;
  primaryCode: string;
  language: string;
  tags: string[];
}

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

function coerceRawMixedContentAnalysisResult(
  value: unknown,
): RawMixedContentAnalysisResult | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const suggestedTitle =
    typeof record.suggestedTitle === 'string'
      ? record.suggestedTitle
      : typeof record.title === 'string'
        ? record.title
        : null;
  const formattedNote =
    typeof record.formattedNote === 'string'
      ? record.formattedNote
      : typeof record.note === 'string'
        ? record.note
        : typeof record.summary === 'string'
          ? record.summary
          : null;

  const hasNoteBody = Boolean(formattedNote?.trim());
  const hasCode = Boolean(
    (typeof record.primaryCode === 'string' && record.primaryCode.trim()) ||
      (typeof record.code === 'string' && record.code.trim()),
  );

  if (!suggestedTitle && !hasNoteBody && !hasCode) {
    return null;
  }

  const primaryCode =
    typeof record.primaryCode === 'string'
      ? record.primaryCode
      : typeof record.code === 'string'
        ? record.code
        : '';

  const language = typeof record.language === 'string' ? record.language : 'typescript';

  const rawTags = record.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((tag): tag is string => typeof tag === 'string')
    : [];

  return {
    suggestedTitle: suggestedTitle ?? '',
    formattedNote: formattedNote ?? '',
    primaryCode,
    language,
    tags,
  };
}

function buildMixedContentUserMessage(pageContext: PageContext, locale: Locale): string {
  const descriptionLine = pageContext.metaDescription
    ? `- Description: ${pageContext.metaDescription}`
    : '';

  return [
    buildMixedContentUserPrompt(locale),
    '',
    'Page context:',
    `- Site type: ${pageContext.siteType}`,
    `- URL: ${pageContext.url}`,
    `- Page title: ${pageContext.pageTitle}`,
    descriptionLine,
    '',
    'Selected content (Markdown, preserve structure):',
    pageContext.rawContent,
  ]
    .filter(Boolean)
    .join('\n');
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

export async function analyzeMixedPageContextWithAI(
  pageContext: PageContext,
): Promise<MixedContentAnalysisResult> {
  await ensureOpenAiApiKeyLoaded();
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    throw new AiServiceError(`OpenAI API key is missing. ${OPENAI_API_KEY_ENV_HINT}`);
  }

  const locale = await getLocale();
  const systemPrompt = buildMixedContentSystemPrompt(locale);

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildMixedContentUserMessage(pageContext, locale) },
      ],
      temperature: 0.2,
    }),
  });

  const payload = (await response.json()) as OpenAiChatCompletionResponse;

  if (!response.ok) {
    throw new AiServiceError(
      payload.error?.message ?? `OpenAI request failed with status ${response.status}.`,
    );
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new AiServiceError('OpenAI returned an empty response.');
  }

  let parsed: RawMixedContentAnalysisResult | null;

  try {
    parsed = coerceRawMixedContentAnalysisResult(JSON.parse(content) as unknown);
  } catch {
    throw new AiServiceError(
      'AI вернул некорректный ответ. Можно отредактировать поля вручную и сохранить.',
    );
  }

  if (!parsed) {
    throw new AiServiceError(
      'AI не смог структурировать выделение. Можно отредактировать поля вручную и сохранить.',
    );
  }

  return normalizeMixedContentResult(parsed, pageContext);
}
