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
