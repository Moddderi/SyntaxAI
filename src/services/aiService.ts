import { getLocale } from '../storage/localeStorage';
import { buildSnippetAnalyzerSystemPrompt } from '../utils/aiLocalePrompts';
import {
  ensureOpenAiApiKeyLoaded,
  getOpenAiApiKey,
  OPENAI_API_KEY_ENV_HINT,
} from './apiKeyStorage';
import {
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from '../utils/techDetection';
import { resolveDeviconSlug } from '../utils/techIcon';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

export interface AnalyzeSnippetInput {
  promptOrCode: string;
  imagesBase64?: string[];
}

export interface AnalyzeSnippetResult {
  title: string;
  primaryTech: string;
  language: string;
  topics: string[];
  summary: string;
  code: string;
}

export class AiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServiceError';
  }
}

interface OpenAiChatMessageContentText {
  type: 'text';
  text: string;
}

interface OpenAiChatMessageContentImage {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

type OpenAiChatMessageContent =
  | OpenAiChatMessageContentText
  | OpenAiChatMessageContentImage;

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

interface RawAnalyzeSnippetResult {
  title: string;
  primaryTech?: string;
  language: string;
  topics?: string[];
  tags?: string[];
  summary?: string;
  code: string;
}

const BLOCKED_TOPIC_TERMS = new Set([
  'typescript',
  'javascript',
  'python',
  'go',
  'golang',
  'rust',
  'java',
  'kotlin',
  'csharp',
  'cplusplus',
  'cpp',
  'c++',
  'bash',
  'sql',
  'html',
  'css',
  'js',
  'ts',
  'py',
  'react',
  'redux',
  'vue',
  'vuejs',
  'nextjs',
  'angular',
  'svelte',
  'django',
  'fastapi',
  'flask',
  'nestjs',
  'prisma',
  'docker',
  'kubernetes',
  'graphql',
  'mongodb',
  'postgresql',
  'mysql',
  'tailwindcss',
  'node',
  'nodejs',
]);

function isRawAnalyzeSnippetResult(value: unknown): value is RawAnalyzeSnippetResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  const hasTopics =
    Array.isArray(record.topics) &&
    record.topics.every((topic) => typeof topic === 'string');

  const hasLegacyTags =
    Array.isArray(record.tags) &&
    record.tags.every((tag) => typeof tag === 'string');

  return (
    typeof record.title === 'string' &&
    typeof record.language === 'string' &&
    typeof record.code === 'string' &&
    (hasTopics || hasLegacyTags) &&
    (typeof record.primaryTech === 'string' || typeof record.language === 'string')
  );
}

export function normalizeTopics(rawTopics: string[]): string[] {
  return rawTopics
    .map((topic) =>
      topic
        .trim()
        .toLowerCase()
        .replace(/^#+/, '')
        .replace(/\s+/g, '-'),
    )
    .filter((topic) => topic.length > 0 && !BLOCKED_TOPIC_TERMS.has(topic))
    .filter((topic, index, array) => array.indexOf(topic) === index)
    .slice(0, 3);
}

function normalizeResult(
  raw: RawAnalyzeSnippetResult,
  sourceText: string,
): AnalyzeSnippetResult {
  const code = raw.code.trim();
  const detectionSource = code || sourceText.trim();
  const aiPrimaryTech = (raw.primaryTech ?? raw.language).trim().toLowerCase();
  const aiLanguage = raw.language.trim().toLowerCase();
  const rawTopics = raw.topics ?? raw.tags ?? [];

  const primaryTech = resolvePrimaryTechnology(
    detectionSource,
    resolveDeviconSlug(aiPrimaryTech),
  );
  const language = resolveBaseLanguage(
    detectionSource,
    primaryTech,
    resolveDeviconSlug(aiLanguage),
  );

  return {
    title: raw.title.trim(),
    primaryTech,
    language,
    topics: normalizeTopics(rawTopics),
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    code: code || sourceText.trim(),
  };
}

function buildUserContent(
  promptOrCode: string,
  imagesBase64?: string[],
): OpenAiChatMessageContent[] {
  const content: OpenAiChatMessageContent[] = [];

  if (promptOrCode.trim()) {
    content.push({
      type: 'text',
      text: promptOrCode.trim(),
    });
  }

  if (imagesBase64 && imagesBase64.length > 0) {
    imagesBase64.forEach((dataUrl) => {
      content.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    });
  }

  if (content.length === 0) {
    throw new AiServiceError('Nothing to analyze: provide code, text, or an image.');
  }

  return content;
}

export async function analyzeSnippetWithAI(
  input: AnalyzeSnippetInput,
): Promise<AnalyzeSnippetResult> {
  await ensureOpenAiApiKeyLoaded();
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    throw new AiServiceError(`OpenAI API key is missing. ${OPENAI_API_KEY_ENV_HINT}`);
  }

  const userContent = buildUserContent(input.promptOrCode, input.imagesBase64);
  const locale = await getLocale();
  const systemPrompt = buildSnippetAnalyzerSystemPrompt(locale);

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
        { role: 'user', content: userContent },
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

  let parsed: unknown;

  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new AiServiceError('OpenAI returned invalid JSON.');
  }

  if (!isRawAnalyzeSnippetResult(parsed)) {
    throw new AiServiceError('OpenAI JSON does not match the expected schema.');
  }

  return normalizeResult(parsed, input.promptOrCode);
}
