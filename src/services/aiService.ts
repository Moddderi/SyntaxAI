import { getLocale } from '../storage/localeStorage';
import { detectTech } from '../utils/techDetection';
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

  const { primaryTech, language } = detectTech(
    { code: detectionSource },
    {
      primaryTech: resolveDeviconSlug(aiPrimaryTech),
      language: resolveDeviconSlug(aiLanguage),
    },
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

/**
 * POST JSON to an AI endpoint with a long timeout and human-readable failures
 * (timeout / offline) instead of an opaque "analysis failed".
 */
export async function postAiRequest(path: string, body: unknown): Promise<Response> {
  try {
    // /api/v1/ai/* gets the long (60 s) timeout inside apiFetch.
    return await apiFetchAuthed(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AiServiceError(
        'AI took too long to respond. Try a shorter selection or try again.',
      );
    }

    throw new AiServiceError(
      'Cannot reach SyntaxAI right now. Check your connection and try again.',
    );
  }
}

export async function readAiHttpErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) {
    return 'Sign in to SyntaxAI to use AI analysis.';
  }

  if (response.status === 429) {
    return 'Too many AI requests. Wait a minute and try again.';
  }

  if (response.status === 413) {
    return 'That content is too large to analyze. Use a shorter selection or smaller image.';
  }

  if (response.status === 503) {
    return 'AI is temporarily unavailable. Try again later.';
  }

  const contentType = response.headers.get('content-type') ?? '';
  const looksLikeHtml = contentType.includes('text/html');

  if (response.status === 403 && looksLikeHtml) {
    return 'Blocked by an edge firewall in front of the API. Try again or check api.syntaxai.app.';
  }

  try {
    const payload = (await response.json()) as AnalyzeSnippetApiResponse;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // fall through
  }

  if (response.status === 403) {
    return 'AI request forbidden (403). Sign in again or check API access.';
  }

  return `AI request failed with status ${response.status}.`;
}

export async function analyzeSnippetWithAI(
  input: AnalyzeSnippetInput,
): Promise<AnalyzeSnippetResult> {
  assertHasInput(input.promptOrCode, input.imagesBase64);

  const locale = await getLocale();
  const response = await postAiRequest('/api/v1/ai/analyze-snippet', {
    locale,
    promptOrCode: input.promptOrCode,
    imagesBase64: input.imagesBase64,
  });

  if (!response.ok) {
    throw new AiServiceError(await readAiHttpErrorMessage(response));
  }

  const payload = (await response.json()) as AnalyzeSnippetApiResponse;

  if (!isRawAnalyzeSnippetResult(payload.result)) {
    throw new AiServiceError('AI JSON does not match the expected schema.');
  }

  return normalizeResult(payload.result, input.promptOrCode);
}
