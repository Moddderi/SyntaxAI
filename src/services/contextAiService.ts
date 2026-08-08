import type { MixedContentAnalysisResult, PageContext } from '../types/context';
import {
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from '../utils/techDetection';
import { resolveDeviconSlug } from '../utils/techIcon';
import { getOpenAiApiKey } from './apiKeyStorage';
import { AiServiceError, normalizeTopics } from './aiService';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

const MIXED_CONTENT_SYSTEM_PROMPT = `Ты — AI-ассистент для разработчиков в SyntaxAI. Тебе передан выделенный фрагмент из документации/сайта, который содержит текстовые правила и блоки кода.

Твоя задача — вернуть STRICTLY JSON без markdown-оберток (\`\`\`json) со следующей структурой:
{
  "suggestedTitle": "Ёмкий заголовок заметки",
  "formattedNote": "Полный структурированный текст заметки в формате Markdown, включая текстовые правила, буллеты и описания",
  "primaryCode": "Основной извлеченный блок кода (если он есть)",
  "language": "язык программирования (javascript, typescript, python и т.д.)",
  "tags": ["массив", "тегов", "без-решеток"]
}

Правила:
1. НЕ теряй важный контекст (версии, правила работы функций, предупреждения из текста).
2. Если кода несколько блоков — объедини их или занеси главный в primaryCode, а остальные сохрани внутри formattedNote.
3. tags — только контекст задачи, без названий языков и фреймворков.
4. formattedNote должен быть готов к сохранению как markdown-заметка разработчика.`;

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

  if (!suggestedTitle || !formattedNote) {
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
    suggestedTitle,
    formattedNote,
    primaryCode,
    language,
    tags,
  };
}

function buildMixedContentUserPrompt(pageContext: PageContext): string {
  const descriptionLine = pageContext.metaDescription
    ? `- Description: ${pageContext.metaDescription}`
    : '';

  return [
    'Проанализируй выделенный фрагмент страницы и подготовь заметку для базы знаний разработчика.',
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
  const detectionSource = primaryCode || pageContext.rawContent;
  const aiLanguage = resolveDeviconSlug(raw.language.trim().toLowerCase());
  const primaryTech = resolvePrimaryTechnology(detectionSource, aiLanguage);
  const language = resolveBaseLanguage(detectionSource, primaryTech, aiLanguage);

  return {
    suggestedTitle: raw.suggestedTitle.trim(),
    formattedNote,
    primaryCode,
    language,
    tags: normalizeTopics(raw.tags),
    primaryTech,
  };
}

export async function analyzeMixedPageContextWithAI(
  pageContext: PageContext,
): Promise<MixedContentAnalysisResult> {
  const apiKey = await getOpenAiApiKey();

  if (!apiKey) {
    throw new AiServiceError(
      'OpenAI API key is missing. Add it in SyntaxAI Settings.',
    );
  }

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
        { role: 'system', content: MIXED_CONTENT_SYSTEM_PROMPT },
        { role: 'user', content: buildMixedContentUserPrompt(pageContext) },
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
