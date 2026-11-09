import {
  TECH_BY_SLUG,
  TECH_CATALOG,
  getTechDef,
  resolveTechSlug,
  type TechDef,
  type TechKind,
} from './techCatalog';

/**
 * Technology detection engine.
 *
 * Every catalog entry is scored against the captured text (code + notes + page URL).
 * The best framework/library/tool becomes the "primary technology" (card icon);
 * the best language becomes the base language (nested icon). AI hints are blended in
 * but cannot override strong local evidence.
 */

const SCORE = { strong: 10, medium: 5, weak: 2, domain: 12, weakDomain: 4, mention: 3, titleMention: 8 } as const;
const PRIMARY_THRESHOLD = 10;
const LANGUAGE_THRESHOLD = 5;
const SCORE_CAP = 40;
const MAX_TEXT_LENGTH = 24_000;

const JS_FAMILY = new Set(['javascript', 'typescript']);

const LANGUAGE_FAMILIES: ReadonlyArray<ReadonlySet<string>> = [
  JS_FAMILY,
  new Set(['html5', 'css3', 'sass', 'xml']),
  new Set(['c', 'cplusplus', 'objectivec']),
  new Set(['sql']),
];

function sameFamily(a: string, b: string): boolean {
  return LANGUAGE_FAMILIES.some((family) => family.has(a) && family.has(b));
}

const KIND_RANK: Record<TechKind, number> = {
  framework: 4,
  library: 3,
  platform: 2,
  tool: 2,
  database: 2,
  utility: 1,
  language: 0,
};

export interface TechDetectionInput {
  title?: string;
  body?: string;
  code?: string;
  url?: string;
}

export interface TechDetectionHints {
  /** Language suggested by AI / the user. */
  language?: string;
  /** Primary technology suggested by AI / the user. */
  primaryTech?: string;
}

export interface TechCandidate {
  slug: string;
  score: number;
}

export interface TechDetection {
  primaryTech: string;
  language: string;
  confidence: 'high' | 'medium' | 'low';
  /** Best non-language candidates, strongest first (after dropping implied hosts). */
  candidates: TechCandidate[];
  languageScores: TechCandidate[];
}

// ─────────────────────────── Compiled lookups ───────────────────────────

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

interface CompiledTech {
  def: TechDef;
  domainPatterns: RegExp[];
  weakDomainPatterns: RegExp[];
  mentionPattern: RegExp | null;
}

function compileDomain(domain: string): RegExp {
  return new RegExp(`(?:^|//|\\.|@)${escapeRegex(domain.toLowerCase())}(?:[/?#:]|$)`);
}

const COMPILED: CompiledTech[] = TECH_CATALOG.map((def) => ({
  def,
  domainPatterns: (def.domains ?? []).map(compileDomain),
  weakDomainPatterns: (def.weakDomains ?? []).map(compileDomain),
  mentionPattern: def.mentions?.length
    ? new RegExp(`(?<![\\w.-])(?:${def.mentions.join('|')})(?![\\w-])`, 'gi')
    : null,
}));

const LANGUAGE_SLUGS = new Set(
  TECH_CATALOG.filter((tech) => tech.kind === 'language').map((tech) => tech.slug),
);

export const PRIMARY_TECH_SLUGS: readonly string[] = TECH_CATALOG.map((tech) => tech.slug);

// ─────────────────────────────── Scoring ───────────────────────────────

function clampText(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) {
    return text;
  }

  return `${text.slice(0, 17_000)}\n${text.slice(-7_000)}`;
}

function countMatches(pattern: RegExp, text: string, max: number): number {
  pattern.lastIndex = 0;
  let count = 0;

  while (count < max && pattern.exec(text) !== null) {
    count += 1;

    if (pattern.lastIndex === 0) {
      break;
    }
  }

  pattern.lastIndex = 0;
  return count;
}

function scoreTech(
  compiled: CompiledTech,
  signalText: string,
  proseText: string,
  titleText: string,
  url: string,
): number {
  const { def } = compiled;
  let score = 0;

  def.strong?.forEach((pattern) => {
    if (pattern.test(signalText)) score += SCORE.strong;
  });
  def.medium?.forEach((pattern) => {
    if (pattern.test(signalText)) score += SCORE.medium;
  });
  def.weak?.forEach((pattern) => {
    if (pattern.test(signalText)) score += SCORE.weak;
  });

  if (def.custom) {
    score += def.custom(signalText);
  }

  if (url) {
    if (compiled.domainPatterns.some((pattern) => pattern.test(url))) {
      score += SCORE.domain;
    } else if (compiled.weakDomainPatterns.some((pattern) => pattern.test(url))) {
      score += SCORE.weakDomain;
    }
  }

  if (compiled.mentionPattern && proseText) {
    score += Math.min(3, countMatches(compiled.mentionPattern, proseText, 3)) * SCORE.mention;

    if (titleText && countMatches(compiled.mentionPattern, titleText, 1) > 0) {
      score += SCORE.titleMention;
    }
  }

  return Math.min(SCORE_CAP, score);
}

function scoreAll(input: TechDetectionInput): Map<string, number> {
  const title = clampText(input.title ?? '');
  const body = clampText(input.body ?? '');
  const code = clampText(input.code ?? '');
  const url = (input.url ?? '').toLowerCase();

  const signalText = [title, body, code].filter(Boolean).join('\n');
  const proseText = [title, body].filter(Boolean).join('\n');
  const scores = new Map<string, number>();

  COMPILED.forEach((compiled) => {
    const score = scoreTech(compiled, signalText, proseText, title, url);

    if (score > 0) {
      scores.set(compiled.def.slug, score);
    }
  });

  return scores;
}

// ────────────────────────────── Decisions ──────────────────────────────

/** True when `host` (transitively) implies `target`, e.g. nextjs -> react. */
function implies(hostSlug: string, targetSlug: string, depth = 0): boolean {
  if (depth > 4) {
    return false;
  }

  const host = TECH_BY_SLUG.get(hostSlug);

  if (!host?.implies) {
    return false;
  }

  return host.implies.some(
    (slug) => slug === targetSlug || implies(slug, targetSlug, depth + 1),
  );
}

/**
 * A weak candidate whose language has no evidence at all, in text that is clearly written in
 * another language, is a false positive (Blade `@include` inside SCSS, `pragma` in Solidity).
 */
function dropOffTopicCandidates(
  candidates: TechCandidate[],
  scores: Map<string, number>,
): TechCandidate[] {
  let topLanguage = { slug: '', score: 0 };

  LANGUAGE_SLUGS.forEach((slug) => {
    const score = scores.get(slug) ?? 0;

    if (score > topLanguage.score) {
      topLanguage = { slug, score };
    }
  });

  if (topLanguage.score < 20) {
    return candidates;
  }

  return candidates.filter((candidate) => {
    const base = TECH_BY_SLUG.get(candidate.slug)?.base;

    if (!base || candidate.score >= 20 || base === topLanguage.slug) {
      return true;
    }

    if (sameFamily(base, topLanguage.slug)) {
      return true;
    }

    return (scores.get(base) ?? 0) >= LANGUAGE_THRESHOLD;
  });
}

function pickCandidates(scores: Map<string, number>): TechCandidate[] {
  const raw: TechCandidate[] = [];

  scores.forEach((score, slug) => {
    const def = TECH_BY_SLUG.get(slug);

    if (def && def.kind !== 'language' && score >= PRIMARY_THRESHOLD) {
      raw.push({ slug, score });
    }
  });

  // Drop hosts that a more specific stack is built on (react < nextjs, vuejs < nuxtjs, ...).
  let candidates = raw.filter(
    (candidate) => !raw.some((other) => other.slug !== candidate.slug && implies(other.slug, candidate.slug)),
  );

  // Utilities (axios, lodash) only win when nothing else was found.
  if (candidates.some((candidate) => TECH_BY_SLUG.get(candidate.slug)?.kind !== 'utility')) {
    candidates = candidates.filter((candidate) => TECH_BY_SLUG.get(candidate.slug)?.kind !== 'utility');
  }

  return candidates.sort((a, b) => {
    const rankDiff =
      KIND_RANK[TECH_BY_SLUG.get(b.slug)?.kind ?? 'tool'] -
      KIND_RANK[TECH_BY_SLUG.get(a.slug)?.kind ?? 'tool'];

    return rankDiff !== 0 ? rankDiff : b.score - a.score;
  });
}

function pickLanguage(
  scores: Map<string, number>,
  primary: TechDef | undefined,
  candidates: TechCandidate[],
  hintLanguage: string | undefined,
): { slug: string | null; ranked: TechCandidate[] } {
  const adjusted = new Map<string, number>();

  LANGUAGE_SLUGS.forEach((slug) => {
    adjusted.set(slug, scores.get(slug) ?? 0);
  });

  const bump = (slug: string | undefined, amount: number): void => {
    if (slug && adjusted.has(slug)) {
      adjusted.set(slug, (adjusted.get(slug) ?? 0) + amount);
    }
  };

  // A stack's own language is a tie-breaker, not an override. TypeScript in particular is only
  // implied when the text shows typed code: plain JS snippets of TS-first stacks stay JavaScript.
  const bumpBase = (slug: string | undefined, amount: number): void => {
    if (slug === 'typescript' && (scores.get('typescript') ?? 0) < LANGUAGE_THRESHOLD) {
      bump('javascript', (scores.get('javascript') ?? 0) > 0 ? amount : 0);
      return;
    }

    bump(slug, amount);
  };

  bumpBase(primary?.base, 8);
  candidates.slice(1).forEach((candidate) => bumpBase(TECH_BY_SLUG.get(candidate.slug)?.base, 3));
  bump(hintLanguage, 6);

  // JS frameworks render markup, but the code is JavaScript/TypeScript — not HTML/CSS.
  const jsFramework = Boolean(primary?.base && JS_FAMILY.has(primary.base));
  const ranked = [...adjusted.entries()]
    .filter(([slug, score]) => score > 0 && (!jsFramework || JS_FAMILY.has(slug)))
    .map(([slug, score]) => ({ slug, score }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return { slug: null, ranked };
  }

  let top = ranked[0];
  const scoreOf = (slug: string): number => adjusted.get(slug) ?? 0;

  if (top.slug === 'javascript' && scoreOf('typescript') >= LANGUAGE_THRESHOLD) {
    top = { slug: 'typescript', score: scoreOf('typescript') };
  } else if (top.slug === 'c' && scoreOf('cplusplus') >= 8) {
    top = { slug: 'cplusplus', score: scoreOf('cplusplus') };
  } else if (top.slug === 'css3' && scoreOf('sass') >= 10) {
    top = { slug: 'sass', score: scoreOf('sass') };
  }

  return { slug: top.score >= LANGUAGE_THRESHOLD ? top.slug : null, ranked };
}

/**
 * AI says "nodejs", local says "express" -> keep the more specific local answer.
 * AI says "react", local strongly says "nextjs" -> same.
 */
function shouldTrustLocal(
  local: TechCandidate | undefined,
  aiSlug: string,
  scores: Map<string, number>,
): boolean {
  if (!local) {
    return false;
  }

  if (local.slug === aiSlug || implies(local.slug, aiSlug)) {
    return true;
  }

  // The AI pick is corroborated by the text itself (e.g. react + zustand in one snippet).
  if ((scores.get(aiSlug) ?? 0) >= PRIMARY_THRESHOLD) {
    return false;
  }

  return local.score >= 20;
}

export function detectTech(
  input: TechDetectionInput,
  hints: TechDetectionHints = {},
): TechDetection {
  const scores = scoreAll(input);
  const candidates = dropOffTopicCandidates(pickCandidates(scores), scores);
  const topLocal = candidates[0];

  const hintLanguageSlug = hints.language ? resolveTechSlug(hints.language) : undefined;
  const hintPrimarySlug = hints.primaryTech ? resolveTechSlug(hints.primaryTech) : undefined;
  const hintLanguageDef = hintLanguageSlug ? getTechDef(hintLanguageSlug) : undefined;

  // A hinted *framework* in the language slot (common AI slip) is treated as a primary hint.
  const aiPrimary =
    hintPrimarySlug && TECH_BY_SLUG.get(hintPrimarySlug)?.kind !== 'language'
      ? hintPrimarySlug
      : hintLanguageDef && hintLanguageDef.kind !== 'language'
        ? hintLanguageDef.slug
        : undefined;

  let primarySlug: string | undefined;

  if (aiPrimary && !shouldTrustLocal(topLocal, aiPrimary, scores)) {
    primarySlug = aiPrimary;
  } else if (topLocal) {
    primarySlug = topLocal.slug;
  }

  const primaryDef = primarySlug ? TECH_BY_SLUG.get(primarySlug) : undefined;
  const effectiveCandidates =
    primarySlug && topLocal?.slug !== primarySlug
      ? [{ slug: primarySlug, score: scores.get(primarySlug) ?? 0 }, ...candidates]
      : candidates;

  const hintedBase =
    hintLanguageDef?.kind === 'language'
      ? hintLanguageDef.slug
      : hintLanguageDef?.base ?? (hintPrimarySlug ? getTechDef(hintPrimarySlug)?.base : undefined);

  const { slug: languageSlug, ranked } = pickLanguage(
    scores,
    primaryDef,
    effectiveCandidates,
    hintedBase,
  );

  const language =
    languageSlug ??
    (hintedBase && LANGUAGE_SLUGS.has(hintedBase) ? hintedBase : undefined) ??
    primaryDef?.base ??
    'javascript';

  let resolvedPrimary = primarySlug;

  if (!resolvedPrimary) {
    const aiLanguagePrimary = hintPrimarySlug && LANGUAGE_SLUGS.has(hintPrimarySlug) ? hintPrimarySlug : undefined;
    resolvedPrimary = languageSlug === 'javascript' && aiLanguagePrimary === 'typescript' ? 'typescript' : languageSlug ?? aiLanguagePrimary ?? language;
  }

  const strength = Math.max(topLocal?.score ?? 0, ranked[0]?.score ?? 0);

  return {
    primaryTech: resolvedPrimary,
    language,
    confidence: strength >= 20 ? 'high' : strength >= 10 ? 'medium' : 'low',
    candidates,
    languageScores: ranked.slice(0, 4),
  };
}

// ───────────────────────── Compatibility helpers ─────────────────────────
// Thin wrappers kept for existing callers.

/** Framework/library slug from signals — never a base language. */
export function inferLibraryFromSignals(source: string): string | null {
  return pickCandidates(scoreAll({ code: source }))[0]?.slug ?? null;
}

export function isBaseLanguageSlug(slug: string): boolean {
  return LANGUAGE_SLUGS.has(resolveTechSlug(slug));
}

export function resolveBaseLanguage(
  code: string,
  primaryTech: string,
  hintedLanguage?: string,
): string {
  return detectTech({ code }, { primaryTech, language: hintedLanguage }).language;
}

/**
 * Best primary technology for icon display.
 * Priority: library/framework signals -> AI non-language slug -> base language.
 */
export function resolvePrimaryTechnology(code: string, aiLanguage: string): string {
  return detectTech({ code }, { primaryTech: aiLanguage, language: aiLanguage }).primaryTech;
}

export function buildTechSlugPromptList(): string {
  return PRIMARY_TECH_SLUGS.join(', ');
}
