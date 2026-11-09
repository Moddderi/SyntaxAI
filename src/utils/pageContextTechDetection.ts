import type { PageContext } from '../types/context';
import { detectTech, isBaseLanguageSlug } from './techDetection';
import { resolveDeviconSlug } from './techIcon';

interface PageTechHint {
  primaryTech: string;
  languageHint?: string;
}

/** Quick URL/title based hint (e.g. while the AI is still analysing). */
export function resolveTechHintFromHaystack(haystack: string): PageTechHint | null {
  const url = /https?:\/\/\S+/i.exec(haystack)?.[0] ?? '';
  const detection = detectTech({ title: haystack, url });
  const primary = detection.candidates[0];

  if (!primary) {
    return null;
  }

  return { primaryTech: primary.slug, languageHint: detection.language };
}

export function resolveTechHintFromPageContext(pageContext: PageContext): PageTechHint | null {
  const detection = detectTech({ title: pageContext.pageTitle, url: pageContext.url });
  const primary = detection.candidates[0];

  if (!primary) {
    return null;
  }

  return { primaryTech: primary.slug, languageHint: detection.language };
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
  /** Prefer this when it is a framework/library slug (e.g. react), not a base language. */
  preferredPrimaryTech?: string;
}

/**
 * Keep AI/detect framework slugs (react, nextjs, …). Fall back when the preferred
 * value is missing or only a base language (javascript, typescript, …).
 */
export function preferFrameworkPrimary(
  preferred: string | undefined,
  fallback: string,
): string {
  if (!preferred?.trim()) {
    return resolveDeviconSlug(fallback);
  }

  const slug = resolveDeviconSlug(preferred);
  return isBaseLanguageSlug(slug) ? resolveDeviconSlug(fallback) : slug;
}

export function resolveNoteTechnology(input: NoteTechInput): ResolvedNoteTechnology {
  const detection = detectTech(
    {
      title: input.title,
      body: input.body,
      code: input.code,
      url: input.sourceUrl,
    },
    {
      language: input.language,
      primaryTech: input.preferredPrimaryTech,
    },
  );

  return {
    primaryTech: resolveDeviconSlug(detection.primaryTech),
    language: resolveDeviconSlug(detection.language),
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

  const resolved = resolveNoteTechnology({
    title: resolvedTitle,
    code: noteCode,
    body: noteBody,
    sourceUrl: pageContext.url,
    language: aiResult?.language,
    preferredPrimaryTech: aiResult?.primaryTech,
  });

  return {
    ...resolved,
    isConfirmed: Boolean(aiResult),
  };
}
