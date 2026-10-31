import { getLocale } from '../storage/localeStorage';
import {
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from '../utils/techDetection';
import { resolveDeviconSlug } from '../utils/techIcon';
import { apiFetchAuthed } from './apiClient';

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

interface RawAnalyzeSnippetResult {
  title: string;
  primaryTech?: string;
  language: string;
  topics?: string[];
  tags?: string[];
  summary?: string;
  code: string;
}

interface AnalyzeSnippetApiResponse {
  result?: RawAnalyzeSnippetResult;
  error?: string;
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

function assertHasInput(promptOrCode: string, imagesBase64?: string[]): void {
  if (promptOrCode.trim() || (imagesBase64 && imagesBase64.length > 0)) {
    return;
  }

  throw new AiServiceError('Nothing to analyze: provide code, text, or an image.');
}

async function readAiErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) {
    return 'Sign in to SyntaxAI to use AI analysis.';
  }

  if (response.status === 503) {
    return 'AI is temporarily unavailable. Try again later.';
  }

  try {
    const payload = (await response.json()) as AnalyzeSnippetApiResponse;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // fall through
  }

  return `AI request failed with status ${response.status}.`;
}

export async function analyzeSnippetWithAI(
  input: AnalyzeSnippetInput,
): Promise<AnalyzeSnippetResult> {
  assertHasInput(input.promptOrCode, input.imagesBase64);

  const locale = await getLocale();
  const response = await apiFetchAuthed('/api/v1/ai/analyze-snippet', {
    method: 'POST',
    body: JSON.stringify({
      locale,
      promptOrCode: input.promptOrCode,
      imagesBase64: input.imagesBase64,
    }),
  });

  if (!response.ok) {
    throw new AiServiceError(await readAiErrorMessage(response));
  }

  const payload = (await response.json()) as AnalyzeSnippetApiResponse;

  if (!isRawAnalyzeSnippetResult(payload.result)) {
    throw new AiServiceError('AI JSON does not match the expected schema.');
  }

  return normalizeResult(payload.result, input.promptOrCode);
}
