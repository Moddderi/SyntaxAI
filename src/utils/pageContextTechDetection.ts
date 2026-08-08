import type { MixedContentAnalysisResult, PageContext } from '../types/context';
import { resolveBaseLanguage, resolvePrimaryTechnology } from './techDetection';

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
  { pattern: /tailwindcss\.com/i, hint: { primaryTech: 'tailwindcss', languageHint: 'css3' } },
  { pattern: /docs\.django/i, hint: { primaryTech: 'django', languageHint: 'python' } },
  { pattern: /fastapi\.tiangolo\.com/i, hint: { primaryTech: 'fastapi', languageHint: 'python' } },
  { pattern: /flask\.palletsprojects\.com/i, hint: { primaryTech: 'flask', languageHint: 'python' } },
  { pattern: /docs\.nestjs\.com/i, hint: { primaryTech: 'nestjs', languageHint: 'typescript' } },
  { pattern: /expressjs\.com/i, hint: { primaryTech: 'express', languageHint: 'javascript' } },
  { pattern: /nodejs\.org/i, hint: { primaryTech: 'nodejs', languageHint: 'javascript' } },
  { pattern: /redux\.js\.org/i, hint: { primaryTech: 'redux', languageHint: 'javascript' } },
  { pattern: /developer\.mozilla\.org/i, hint: { primaryTech: 'javascript' } },
  { pattern: /go\.dev|golang\.org/i, hint: { primaryTech: 'go', languageHint: 'go' } },
  { pattern: /rust-lang\.org|docs\.rs/i, hint: { primaryTech: 'rust', languageHint: 'rust' } },
  { pattern: /kubernetes\.io/i, hint: { primaryTech: 'kubernetes' } },
  { pattern: /docker\.com/i, hint: { primaryTech: 'docker' } },
];

export function resolveTechHintFromPageContext(pageContext: PageContext): PageTechHint | null {
  const haystack = `${pageContext.url} ${pageContext.pageTitle}`;

  for (const rule of URL_TECH_RULES) {
    if (rule.pattern.test(haystack)) {
      return rule.hint;
    }
  }

  return null;
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
  aiResult?: MixedContentAnalysisResult | null,
): ResolvedCaptureTech {
  if (aiResult) {
    return {
      primaryTech: aiResult.primaryTech,
      language: aiResult.language,
      isConfirmed: true,
    };
  }

  const pageHint = resolveTechHintFromPageContext(pageContext);
  const detectionSource = [noteCode, noteBody, pageContext.rawContent, pageContext.pageTitle]
    .filter(Boolean)
    .join('\n');

  const primaryTech = resolvePrimaryTechnology(
    detectionSource,
    pageHint?.languageHint ?? pageHint?.primaryTech ?? 'javascript',
  );

  const resolvedPrimary =
    primaryTech === 'javascript' && pageHint?.primaryTech ? pageHint.primaryTech : primaryTech;

  const language = resolveBaseLanguage(
    detectionSource,
    resolvedPrimary,
    pageHint?.languageHint,
  );

  return {
    primaryTech: resolvedPrimary,
    language,
    isConfirmed: false,
  };
}
