const TECH_ALIASES: Record<string, string> = {
  ts: 'typescript',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  rs: 'rust',
  rust: 'rust',
  js: 'javascript',
  javascript: 'javascript',
  cpp: 'cplusplus',
  'c++': 'cplusplus',
  cplusplus: 'cplusplus',
  asm: 'assembly',
  assembly: 'assembly',
  assembler: 'assembly',
  sh: 'bash',
  bash: 'bash',
  go: 'go',
  golang: 'go',
  sql: 'postgresql',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  mysql: 'mysql',
  react: 'react',
  redux: 'redux',
  vue: 'vuejs',
  vuejs: 'vuejs',
  next: 'nextjs',
  nextjs: 'nextjs',
  nuxt: 'nuxtjs',
  nuxtjs: 'nuxtjs',
  django: 'django',
  fastapi: 'fastapi',
  flask: 'flask',
  nestjs: 'nestjs',
  nest: 'nestjs',
  prisma: 'prisma',
  express: 'express',
  node: 'nodejs',
  nodejs: 'nodejs',
  docker: 'docker',
  kubernetes: 'kubernetes',
  k8s: 'kubernetes',
  graphql: 'graphql',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  tailwind: 'tailwindcss',
  tailwindcss: 'tailwindcss',
  html: 'html5',
  html5: 'html5',
  css: 'css3',
  css3: 'css3',
  svelte: 'svelte',
  angular: 'angular',
  java: 'java',
  kotlin: 'kotlin',
  csharp: 'csharp',
  'c#': 'csharp',
  dart: 'dart',
  flutter: 'flutter',
  swift: 'swift',
};

const TECH_ABBREVIATIONS: Record<string, string> = {
  bash: 'BSH',
  assembly: 'ASM',
  asm: 'ASM',
  assembler: 'ASM',
  typescript: 'TS',
  javascript: 'JS',
  python: 'PY',
  rust: 'RS',
  cplusplus: 'CPP',
  'c++': 'CPP',
  cpp: 'CPP',
  postgresql: 'SQL',
  mysql: 'SQL',
  sql: 'SQL',
  docker: 'DCK',
  tailwindcss: 'TWL',
  react: 'RCT',
  redux: 'RDX',
  nextjs: 'NXT',
  vuejs: 'VUE',
  django: 'DJA',
  fastapi: 'API',
  flask: 'FLK',
  nestjs: 'NST',
  prisma: 'PRM',
  graphql: 'GQL',
  kubernetes: 'K8S',
  mongodb: 'MDB',
  angular: 'ANG',
  svelte: 'SVL',
};

const DEVICON_ICON_VARIANTS: Record<string, 'original' | 'plain'> = {
  rust: 'plain',
  csharp: 'plain',
  cplusplus: 'plain',
  django: 'plain',
  go: 'original',
  java: 'original',
  kotlin: 'original',
  swift: 'original',
  dart: 'original',
  flutter: 'plain',
  svelte: 'original',
  angular: 'original',
  docker: 'original',
  kubernetes: 'plain',
  graphql: 'plain',
  mongodb: 'plain',
  postgresql: 'original',
  mysql: 'original',
  bash: 'original',
  assembly: 'plain',
};

function buildDeviconUrlForSlug(slug: string, iconVariant: 'original' | 'plain'): string {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${slug}/${slug}-${iconVariant}.svg`;
}

export function getDeviconUrlCandidates(
  tech: string,
  variant: 'default' | 'language' = 'default',
): string[] {
  const slug =
    variant === 'language' ? resolveLanguageDeviconSlug(tech) : resolveDeviconSlug(tech);
  const preferred = DEVICON_ICON_VARIANTS[slug] ?? 'original';
  const alternate: 'original' | 'plain' = preferred === 'original' ? 'plain' : 'original';

  return [
    buildDeviconUrlForSlug(slug, preferred),
    buildDeviconUrlForSlug(slug, alternate),
  ];
}

/** Base languages with confirmed Devicon icon folders. */
const BASE_LANGUAGE_DEVICON_SLUGS: Record<string, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  java: 'java',
  kotlin: 'kotlin',
  csharp: 'csharp',
  cplusplus: 'cplusplus',
  cpp: 'cplusplus',
  bash: 'bash',
  html5: 'html5',
  html: 'html5',
  css3: 'css3',
  css: 'css3',
  swift: 'swift',
  dart: 'dart',
  ruby: 'ruby',
  php: 'php',
  scala: 'scala',
  elixir: 'elixir',
  postgresql: 'postgresql',
  mysql: 'mysql',
};

export function resolveDeviconSlug(tech: string): string {
  const normalized = tech.trim().toLowerCase();
  return TECH_ALIASES[normalized] ?? normalized.replace(/[^a-z0-9]/g, '');
}

export function resolveLanguageDeviconSlug(language: string): string {
  const slug = resolveDeviconSlug(language);
  return BASE_LANGUAGE_DEVICON_SLUGS[slug] ?? slug;
}

export function shouldNestLanguageIcon(primaryTech: string, language: string): boolean {
  return resolveDeviconSlug(primaryTech) !== resolveDeviconSlug(language);
}

export function buildDeviconUrl(tech: string): string {
  return getDeviconUrlCandidates(tech)[0];
}

export function buildLanguageDeviconUrl(language: string): string {
  return getDeviconUrlCandidates(language, 'language')[0];
}

export function getTechAbbreviation(tech: string): string {
  const normalized = tech.trim().toLowerCase();
  const mapped = TECH_ABBREVIATIONS[normalized];

  if (mapped) {
    return mapped;
  }

  const slug = resolveDeviconSlug(tech);
  const slugAbbreviation = TECH_ABBREVIATIONS[slug];

  if (slugAbbreviation) {
    return slugAbbreviation;
  }

  const alnum = tech.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return alnum.slice(0, 3) || 'TEC';
}

const TECHNOLOGY_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  cplusplus: 'C++',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  react: 'React',
  redux: 'Redux',
  vuejs: 'Vue.js',
  nextjs: 'Next.js',
  nuxtjs: 'Nuxt.js',
  nodejs: 'Node.js',
  django: 'Django',
  fastapi: 'FastAPI',
  flask: 'Flask',
  nestjs: 'NestJS',
  prisma: 'Prisma',
  express: 'Express',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  graphql: 'GraphQL',
  mongodb: 'MongoDB',
  tailwindcss: 'Tailwind CSS',
  html5: 'HTML5',
  css3: 'CSS3',
  svelte: 'Svelte',
  angular: 'Angular',
  java: 'Java',
  kotlin: 'Kotlin',
  csharp: 'C#',
  dart: 'Dart',
  flutter: 'Flutter',
  swift: 'Swift',
  bash: 'Bash',
  assembly: 'Assembly',
};

export function formatTechnologyLabel(slug: string): string {
  return TECHNOLOGY_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Official / recognizable brand colors for stack analytics (pie chart, bars). */
const TECH_BRAND_COLORS: Record<string, string> = {
  react: '#61DAFB',
  redux: '#764ABC',
  nextjs: '#0070F3',
  vuejs: '#4FC08D',
  nuxtjs: '#00DC82',
  angular: '#DD0031',
  svelte: '#FF3E00',
  django: '#44B78B',
  fastapi: '#009688',
  flask: '#3CAA3D',
  nestjs: '#E0234E',
  prisma: '#71E8DF',
  express: '#90A4AE',
  tailwindcss: '#06B6D4',
  docker: '#2496ED',
  kubernetes: '#326CE5',
  graphql: '#E10098',
  nodejs: '#339933',
  mongodb: '#47A248',
  postgresql: '#4169E1',
  mysql: '#4479A1',
  typescript: '#3178C6',
  javascript: '#F7DF1E',
  python: '#3776AB',
  go: '#00ADD8',
  rust: '#F74C00',
  bash: '#4EAA25',
  csharp: '#512BD4',
  java: '#ED8B00',
  kotlin: '#7F52FF',
  swift: '#F05138',
  flutter: '#02569B',
  dart: '#0175C2',
  html5: '#E34F26',
  css3: '#1572B6',
  ruby: '#CC342D',
  php: '#777BB4',
  cplusplus: '#00599C',
  cpp: '#00599C',
  assembly: '#6B7280',
};

function hashSlugToColor(slug: string): string {
  let hash = 0;

  for (let index = 0; index < slug.length; index += 1) {
    hash = slug.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 52%)`;
}

export function getTechBrandColor(tech: string): string {
  const slug = resolveDeviconSlug(tech);
  return TECH_BRAND_COLORS[slug] ?? hashSlugToColor(slug);
}
