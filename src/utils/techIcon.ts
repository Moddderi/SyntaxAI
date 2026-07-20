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
  node: 'nodejs',
  nodejs: 'nodejs',
  docker: 'docker',
  tailwind: 'tailwindcss',
  tailwindcss: 'tailwindcss',
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
};

export function resolveDeviconSlug(tech: string): string {
  const normalized = tech.trim().toLowerCase();
  return TECH_ALIASES[normalized] ?? normalized.replace(/[^a-z0-9]/g, '');
}

export function buildDeviconUrl(tech: string): string {
  const slug = resolveDeviconSlug(tech);
  return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${slug}/${slug}-original.svg`;
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
