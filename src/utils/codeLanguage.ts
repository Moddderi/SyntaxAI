import { resolveDeviconSlug } from './techIcon';

const PRISM_LANGUAGE_ALIASES: Record<string, string> = {
  typescript: 'typescript',
  ts: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  python: 'python',
  py: 'python',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
  cplusplus: 'cpp',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'csharp',
  'c#': 'csharp',
  java: 'java',
  kotlin: 'kotlin',
  swift: 'swift',
  dart: 'dart',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  postgresql: 'sql',
  postgres: 'sql',
  mysql: 'sql',
  sql: 'sql',
  html5: 'markup',
  html: 'markup',
  css3: 'css',
  css: 'css',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  markdown: 'markdown',
  md: 'markdown',
  graphql: 'graphql',
  docker: 'docker',
  dockerfile: 'docker',
  php: 'php',
  ruby: 'ruby',
  scala: 'scala',
  elixir: 'elixir',
  react: 'tsx',
  redux: 'javascript',
  nextjs: 'tsx',
  nuxtjs: 'javascript',
  vuejs: 'javascript',
  angular: 'typescript',
  svelte: 'javascript',
  nestjs: 'typescript',
  express: 'javascript',
  nodejs: 'javascript',
  prisma: 'typescript',
  django: 'python',
  fastapi: 'python',
  flask: 'python',
  tailwindcss: 'css',
  mongodb: 'javascript',
  kubernetes: 'yaml',
  other: 'text',
  text: 'text',
  plaintext: 'text',
};

const DEFAULT_PRISM_LANGUAGE = 'javascript';

export function resolvePrismLanguage(language?: string): string {
  if (!language || language.trim().length === 0) {
    return DEFAULT_PRISM_LANGUAGE;
  }

  const normalized = resolveDeviconSlug(language.trim().toLowerCase());
  return PRISM_LANGUAGE_ALIASES[normalized] ?? DEFAULT_PRISM_LANGUAGE;
}

export function getCodePreviewLines(code: string, maxLines = 4): string {
  const lines = code.split('\n');

  if (lines.length <= maxLines) {
    return code;
  }

  return lines.slice(0, maxLines).join('\n');
}
