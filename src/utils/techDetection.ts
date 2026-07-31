import { resolveDeviconSlug } from './techIcon';

interface TechSignalRule {
  slug: string;
  patterns: RegExp[];
  weight: number;
}

/**
 * Higher weight = stronger signal. Framework/library beats base language.
 * Slugs must match Devicon icon names where possible.
 */
const TECH_SIGNAL_RULES: TechSignalRule[] = [
  {
    slug: 'redux',
    weight: 14,
    patterns: [
      /\buseSelector\b/,
      /\buseDispatch\b/,
      /\bcreateSlice\b/,
      /\bconfigureStore\b/,
      /@reduxjs\/toolkit/,
      /from ['"]react-redux['"]/,
      /from ['"]redux['"]/,
    ],
  },
  {
    slug: 'nextjs',
    weight: 13,
    patterns: [
      /from ['"]next\//,
      /\bgetServerSideProps\b/,
      /\bgetStaticProps\b/,
      /\buseRouter\b/,
      /\bNextResponse\b/,
      /\bNextRequest\b/,
    ],
  },
  {
    slug: 'react',
    weight: 12,
    patterns: [
      /from ['"]react['"]/,
      /from ['"]react-dom/,
      /\buse(?:State|Effect|Callback|Memo|Ref|Context|Reducer|LayoutEffect|ImperativeHandle|Id|DeferredValue|Transition|SyncExternalStore)\b/,
      /<\/?[A-Z][A-Za-z0-9]*[\s/>]/,
      /className=/,
    ],
  },
  {
    slug: 'vuejs',
    weight: 12,
    patterns: [
      /from ['"]vue['"]/,
      /\bdefineComponent\b/,
      /\bref\s*\(/,
      /\bcomputed\s*\(/,
      /\bonMounted\b/,
      /<template>/,
    ],
  },
  {
    slug: 'angular',
    weight: 12,
    patterns: [
      /@Component\s*\(/,
      /@Injectable\s*\(/,
      /from ['"]@angular\//,
      /\bNgModule\b/,
    ],
  },
  {
    slug: 'svelte',
    weight: 12,
    patterns: [/<script[^>]*lang=["']ts["']/, /\bon:click\b/, /export let /],
  },
  {
    slug: 'django',
    weight: 13,
    patterns: [
      /from django/,
      /import django/,
      /@api_view/,
      /models\.Model/,
      /class Meta:/,
      /django\.db/,
    ],
  },
  {
    slug: 'fastapi',
    weight: 13,
    patterns: [
      /from fastapi/,
      /import FastAPI/,
      /@app\.(get|post|put|delete|patch)\(/,
      /APIRouter\s*\(/,
    ],
  },
  {
    slug: 'flask',
    weight: 12,
    patterns: [/from flask/, /Flask\s*\(/, /@app\.route\s*\(/],
  },
  {
    slug: 'nestjs',
    weight: 12,
    patterns: [
      /@nestjs\/common/,
      /@Controller\s*\(/,
      /@Injectable\s*\(/,
      /@Module\s*\(/,
    ],
  },
  {
    slug: 'prisma',
    weight: 11,
    patterns: [/from ['"]@prisma\/client['"]/, /\bprisma\.\w+\(/, /PrismaClient/],
  },
  {
    slug: 'tailwindcss',
    weight: 11,
    patterns: [
      /\b(?:bg|text|border|rounded|shadow|flex|grid|gap|p|px|py|m|mx|my|w|h|min-h|max-w)-[\w-/[\]:]+/,
      /\b(?:hover|focus|active|md|lg|xl|2xl):[\w-]+/,
      /className=["'][^"']*(?:bg-|text-|flex|grid|rounded-)/,
      /class=["'][^"']*(?:bg-|text-|flex|grid|rounded-)/,
    ],
  },
  {
    slug: 'docker',
    weight: 10,
    patterns: [/^FROM\s+/m, /^RUN\s+/m, /^COPY\s+/m, /^WORKDIR\s+/m],
  },
  {
    slug: 'kubernetes',
    weight: 10,
    patterns: [/^apiVersion:/m, /^kind:\s/m, /metadata:\s*\n\s*name:/m],
  },
  {
    slug: 'graphql',
    weight: 10,
    patterns: [/\bquery\s+\w+/, /\bmutation\s+\w+/, /\bsubscription\s+\w+/],
  },
  {
    slug: 'postgresql',
    weight: 9,
    patterns: [/\bSELECT\b.+\bFROM\b/i, /\bINSERT INTO\b/i, /\bCREATE TABLE\b/i],
  },
  {
    slug: 'mongodb',
    weight: 9,
    patterns: [/mongoose\./, /MongoClient/, /\.findOne\s*\(/, /\.aggregate\s*\(/],
  },
  {
    slug: 'typescript',
    weight: 6,
    patterns: [
      /:\s*(?:string|number|boolean|void|unknown|never)\b/,
      /\binterface\s+\w+/,
      /\btype\s+\w+\s*=/,
      /<\w+(?:,\s*\w+)*>/,
    ],
  },
  {
    slug: 'javascript',
    weight: 4,
    patterns: [/\bconst\s+\w+\s*=/, /\bfunction\s+\w+/, /=>\s*{/, /require\s*\(/],
  },
  {
    slug: 'python',
    weight: 5,
    patterns: [/^def\s+\w+/m, /^class\s+\w+.*:/m, /import\s+\w+/, /from\s+\w+\s+import/],
  },
  {
    slug: 'go',
    weight: 5,
    patterns: [/^func\s+/m, /^package\s+\w+/m, /:=/],
  },
  {
    slug: 'rust',
    weight: 5,
    patterns: [/^fn\s+\w+/m, /let mut\s+/, /impl\s+\w+/],
  },
];

/** Framework/library slugs — preferred over base languages in AI output. */
export const PRIMARY_TECH_SLUGS = [
  'react',
  'redux',
  'nextjs',
  'vuejs',
  'angular',
  'svelte',
  'django',
  'fastapi',
  'flask',
  'nestjs',
  'prisma',
  'tailwindcss',
  'docker',
  'kubernetes',
  'graphql',
  'nodejs',
  'express',
  'mongodb',
  'postgresql',
  'mysql',
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'bash',
  'csharp',
  'java',
  'kotlin',
  'swift',
  'flutter',
  'dart',
] as const;

const BASE_LANGUAGE_SLUGS = new Set([
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'java',
  'kotlin',
  'csharp',
  'cpp',
  'cplusplus',
  'bash',
  'html5',
  'css3',
  'html',
  'css',
]);

const PRIMARY_TO_BASE_LANGUAGE: Record<string, string> = {
  react: 'javascript',
  redux: 'javascript',
  vuejs: 'javascript',
  svelte: 'javascript',
  angular: 'typescript',
  nextjs: 'typescript',
  nuxtjs: 'javascript',
  nestjs: 'typescript',
  express: 'javascript',
  nodejs: 'javascript',
  prisma: 'typescript',
  django: 'python',
  fastapi: 'python',
  flask: 'python',
  tailwindcss: 'css3',
  graphql: 'javascript',
  docker: 'bash',
  kubernetes: 'bash',
  postgresql: 'sql',
  mysql: 'sql',
  mongodb: 'javascript',
  flutter: 'dart',
};

export function isBaseLanguageSlug(slug: string): boolean {
  return BASE_LANGUAGE_SLUGS.has(resolveDeviconSlug(slug));
}

export function resolveBaseLanguage(
  code: string,
  primaryTech: string,
  hintedLanguage?: string,
): string {
  const hint = hintedLanguage ? resolveDeviconSlug(hintedLanguage) : null;

  if (hint && BASE_LANGUAGE_SLUGS.has(hint)) {
    return hint;
  }

  if (/:\s*[\w<]|interface |type \w+ =/.test(code)) {
    return 'typescript';
  }

  if (/\bdef \w+\(/.test(code)) {
    return 'python';
  }

  if (/\bfn \w+\(/.test(code) || /\bpackage main\b/.test(code)) {
    return 'go';
  }

  if (/#include|std::/.test(code)) {
    return 'cplusplus';
  }

  return PRIMARY_TO_BASE_LANGUAGE[resolveDeviconSlug(primaryTech)] ?? 'javascript';
}

function scoreTechSignals(code: string): Map<string, number> {
  const scores = new Map<string, number>();

  TECH_SIGNAL_RULES.forEach((rule) => {
    const matched = rule.patterns.some((pattern) => pattern.test(code));

    if (matched) {
      scores.set(rule.slug, (scores.get(rule.slug) ?? 0) + rule.weight);
    }
  });

  return scores;
}

function getTopScoredSlug(scores: Map<string, number>): string | null {
  let topSlug: string | null = null;
  let topScore = 0;

  scores.forEach((score, slug) => {
    if (score > topScore) {
      topScore = score;
      topSlug = slug;
    }
  });

  return topScore >= 8 ? topSlug : null;
}

/**
 * Picks the best primary technology slug for icon display.
 *
 * AI-first: gpt-4o-mini detects ANY stack dynamically — users never configure this.
 * Local heuristics only fix common AI mistakes (e.g. "javascript" for React hooks).
 */
export function resolvePrimaryTechnology(code: string, aiLanguage: string): string {
  const normalizedAi = resolveDeviconSlug(aiLanguage);

  if (!BASE_LANGUAGE_SLUGS.has(normalizedAi)) {
    return normalizedAi;
  }

  const inferredSlug = getTopScoredSlug(scoreTechSignals(code));
  return inferredSlug ?? normalizedAi;
}

export function buildTechSlugPromptList(): string {
  return PRIMARY_TECH_SLUGS.join(', ');
}
