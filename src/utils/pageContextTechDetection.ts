import type { PageContext } from '../types/context';
import { resolveDeviconSlug } from './techIcon';
import {
  inferLibraryFromSignals,
  isBaseLanguageSlug,
  resolveBaseLanguage,
  resolvePrimaryTechnology,
} from './techDetection';

interface PageTechHint {
  primaryTech: string;
  languageHint?: string;
}

const URL_TECH_RULES: Array<{ pattern: RegExp; hint: PageTechHint }> = [
  { pattern: /react-hook-form\.com/i, hint: { primaryTech: 'react' } },
  { pattern: /react(?:\.dev|js\.org)/i, hint: { primaryTech: 'react' } },
  { pattern: /nextjs\.org/i, hint: { primaryTech: 'nextjs', languageHint: 'typescript' } },
  { pattern: /nuxt\.com/i, hint: { primaryTech: 'nuxtjs' } },
  { pattern: /vuejs\.org/i, hint: { primaryTech: 'vuejs' } },
  { pattern: /angular\.io/i, hint: { primaryTech: 'angular', languageHint: 'typescript' } },
  { pattern: /svelte\.dev/i, hint: { primaryTech: 'svelte' } },
  { pattern: /prisma\.io/i, hint: { primaryTech: 'prisma', languageHint: 'typescript' } },
  { pattern: /zod\.dev/i, hint: { primaryTech: 'zod', languageHint: 'typescript' } },
  { pattern: /tailwindcss\.com/i, hint: { primaryTech: 'tailwindcss', languageHint: 'css3' } },
  { pattern: /docs\.django/i, hint: { primaryTech: 'django', languageHint: 'python' } },
  { pattern: /fastapi\.tiangolo\.com/i, hint: { primaryTech: 'fastapi', languageHint: 'python' } },
  { pattern: /flask\.palletsprojects\.com/i, hint: { primaryTech: 'flask', languageHint: 'python' } },
  { pattern: /docs\.nestjs\.com/i, hint: { primaryTech: 'nestjs', languageHint: 'typescript' } },
  { pattern: /expressjs\.com/i, hint: { primaryTech: 'express', languageHint: 'javascript' } },
  { pattern: /nodejs\.org/i, hint: { primaryTech: 'nodejs', languageHint: 'javascript' } },
  { pattern: /redux\.js\.org/i, hint: { primaryTech: 'redux', languageHint: 'javascript' } },
  { pattern: /zustand-demo\.pmnd\.rs|zustand\.pmnd\.rs/i, hint: { primaryTech: 'zustand', languageHint: 'typescript' } },
  { pattern: /developer\.mozilla\.org/i, hint: { primaryTech: 'javascript' } },
  { pattern: /go\.dev|golang\.org/i, hint: { primaryTech: 'go', languageHint: 'go' } },
  { pattern: /rust-lang\.org|docs\.rs/i, hint: { primaryTech: 'rust', languageHint: 'rust' } },
  { pattern: /kubernetes\.io/i, hint: { primaryTech: 'kubernetes' } },
  { pattern: /docker\.com/i, hint: { primaryTech: 'docker' } },
];

const TEXT_TECH_RULES: Array<{ pattern: RegExp; hint: PageTechHint }> = [
  { pattern: /\bzustand\b|\buseStore\b|\bcreate\s*\(\s*\(?\s*set/i, hint: { primaryTech: 'zustand', languageHint: 'typescript' } },
  { pattern: /\bzod\b|\bz\.(?:string|number|object|array)\s*\(/i, hint: { primaryTech: 'zod', languageHint: 'typescript' } },
  { pattern: /react hook form|react-hook-form|\buseForm\s*\(/i, hint: { primaryTech: 'react' } },
  { pattern: /\bhandleSubmit\b|\bregister\s*\(/i, hint: { primaryTech: 'react' } },
  { pattern: /\bnext\.js\b|\bnextjs\b/i, hint: { primaryTech: 'nextjs', languageHint: 'typescript' } },
  { pattern: /\bvue\.js\b|\bvuejs\b|\bdefineComponent\b/i, hint: { primaryTech: 'vuejs' } },
  { pattern: /\bangular\b|\b@angular\//i, hint: { primaryTech: 'angular', languageHint: 'typescript' } },
  { pattern: /\bsvelte\b/i, hint: { primaryTech: 'svelte' } },
  { pattern: /\bprisma\b|\bPrismaClient\b/i, hint: { primaryTech: 'prisma', languageHint: 'typescript' } },
  { pattern: /\bdjango\b/i, hint: { primaryTech: 'django', languageHint: 'python' } },
  { pattern: /\bfastapi\b/i, hint: { primaryTech: 'fastapi', languageHint: 'python' } },
  { pattern: /\bnestjs\b|\b@nestjs\//i, hint: { primaryTech: 'nestjs', languageHint: 'typescript' } },
  { pattern: /\breact\b/i, hint: { primaryTech: 'react' } },
];

export function resolveTechHintFromHaystack(haystack: string): PageTechHint | null {
  for (const rule of URL_TECH_RULES) {
    if (rule.pattern.test(haystack)) {
      return rule.hint;
    }
  }

  for (const rule of TEXT_TECH_RULES) {
    if (rule.pattern.test(haystack)) {
      return rule.hint;
    }
  }

  return null;
}

export function resolveTechHintFromPageContext(pageContext: PageContext): PageTechHint | null {
  return resolveTechHintFromHaystack(`${pageContext.url} ${pageContext.pageTitle}`);
}

export interface ResolvedNoteTechnology {
  primaryTech: string;
  language: string;
}

export interface NoteTechInput {
  title: string;
  code: string;
  body?: string;
  sourceUrl?: string;
  language?: string;
}

function resolvePrimaryWithHint(
  detectionSource: string,
  pageHint: PageTechHint | null,
  fallbackLanguage: string,
): string {
  if (pageHint?.primaryTech && !isBaseLanguageSlug(pageHint.primaryTech)) {
    const libraryPattern = new RegExp(`\\b${pageHint.primaryTech}\\b`, 'i');

    if (libraryPattern.test(detectionSource)) {
      return pageHint.primaryTech;
    }
  }

  const fromSignals = inferLibraryFromSignals(detectionSource);

  if (fromSignals) {
    return fromSignals;
  }

  const primaryFromHeuristics = resolvePrimaryTechnology(
    detectionSource,
    pageHint?.languageHint ?? pageHint?.primaryTech ?? fallbackLanguage,
  );

  if (!isBaseLanguageSlug(primaryFromHeuristics)) {
    return primaryFromHeuristics;
  }

  if (pageHint?.primaryTech) {
    return pageHint.primaryTech;
  }

  return primaryFromHeuristics;
}

export function resolveNoteTechnology(input: NoteTechInput): ResolvedNoteTechnology {
  const detectionSource = [input.title, input.body, input.code, input.sourceUrl]
    .filter(Boolean)
    .join('\n');
  const pageHint = resolveTechHintFromHaystack(detectionSource);
  const fallbackLanguage = input.language ?? 'javascript';
  const primaryTech = resolvePrimaryWithHint(detectionSource, pageHint, fallbackLanguage);
  const language = resolveBaseLanguage(
    detectionSource,
    primaryTech,
    pageHint?.languageHint ?? fallbackLanguage,
  );

  return {
    primaryTech: resolveDeviconSlug(primaryTech),
    language: resolveDeviconSlug(language),
  };
}

export interface ResolvedCaptureTech {
  primaryTech: string;
  language: string;
  isConfirmed: boolean;
}

export function resolveContextCaptureTech(
  pageContext: PageContext,
  noteCode: string,
  noteBody: string,
  aiResult?: { primaryTech: string; language: string; suggestedTitle?: string } | null,
  noteTitle?: string,
): ResolvedCaptureTech {
  const resolvedTitle = noteTitle ?? aiResult?.suggestedTitle ?? pageContext.pageTitle;

  const enriched = resolveNoteTechnology({
    title: resolvedTitle,
    code: noteCode,
    body: noteBody,
    sourceUrl: pageContext.url,
    language: aiResult?.language,
  });

  if (!aiResult) {
    return {
      ...enriched,
      isConfirmed: false,
    };
  }

  const aiPrimary = resolveDeviconSlug(aiResult.primaryTech);
  const useAiPrimary = !isBaseLanguageSlug(aiPrimary);

  return {
    primaryTech: useAiPrimary ? aiPrimary : enriched.primaryTech,
    language: enriched.language,
    isConfirmed: true,
  };
}
