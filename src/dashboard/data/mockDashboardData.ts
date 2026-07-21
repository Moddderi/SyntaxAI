import type {
  LanguageNavItem,
  LibraryNavItem,
  SnippetItem,
  StatCardItem,
} from '../types/dashboard.types';

export const LIBRARY_NAV_ITEMS: LibraryNavItem[] = [
  { id: 'all', label: 'All notes', count: 9, isActive: true },
  { id: 'starred', label: 'Starred', count: 3 },
  { id: 'recent', label: 'Recent', count: 5 },
  { id: 'tags', label: 'Tags', count: 12 },
  { id: 'trash', label: 'Trash', count: 1 },
];

export const LANGUAGE_NAV_ITEMS: LanguageNavItem[] = [
  { id: 'typescript', label: 'TypeScript', tech: 'typescript', count: 3 },
  { id: 'python', label: 'Python', tech: 'python', count: 2 },
  { id: 'go', label: 'Go', tech: 'go', count: 1 },
  { id: 'rust', label: 'Rust', tech: 'rust', count: 1 },
  { id: 'postgresql', label: 'PostgreSQL', tech: 'postgresql', count: 1 },
  { id: 'docker', label: 'Docker', tech: 'docker', count: 1 },
  { id: 'react', label: 'React', tech: 'react', count: 2 },
  { id: 'tailwind', label: 'Tailwind', tech: 'tailwindcss', count: 1 },
];

export const STAT_CARDS: StatCardItem[] = [
  {
    id: 'total-notes',
    label: 'Total Notes',
    value: '9',
    hint: '+2 this week',
  },
  {
    id: 'languages',
    label: 'Languages',
    value: '8',
    hint: 'across your stack',
  },
  {
    id: 'notes-today',
    label: 'Notes Today',
    value: '3',
    hint: 'active note day',
  },
  {
    id: 'ai-credits',
    label: 'AI Credits',
    value: '847',
    hint: 'credits remaining',
  },
];

export const SNIPPET_ITEMS: SnippetItem[] = [
  {
    id: 'snippet-1',
    title: 'useDebouncedValue',
    tech: 'typescript',
    updatedAt: '12m ago',
    codePreview: 'const debounced = useDebouncedValue(value, 300);',
    tags: ['#react', '#hooks'],
    isStarred: true,
  },
  {
    id: 'snippet-2',
    title: 'Prisma findFirst with include',
    tech: 'typescript',
    updatedAt: '2h ago',
    codePreview: 'await prisma.user.findFirst({ include: { posts: true } });',
    tags: ['#prisma', '#db'],
    isStarred: true,
  },
  {
    id: 'snippet-3',
    title: 'pandas groupby + agg',
    tech: 'python',
    updatedAt: '5h ago',
    codePreview: 'df.groupby("category").agg({"price": "mean"})',
    tags: ['#pandas', '#data'],
    isStarred: false,
  },
  {
    id: 'snippet-4',
    title: 'context.WithTimeout',
    tech: 'go',
    updatedAt: '1d ago',
    codePreview: 'ctx, cancel := context.WithTimeout(ctx, 5*time.Second)',
    tags: ['#go', '#context'],
    isStarred: false,
  },
  {
    id: 'snippet-5',
    title: 'Ownership borrowing pattern',
    tech: 'rust',
    updatedAt: '2d ago',
    codePreview: 'fn process(data: &str) -> Result<(), Error> { ... }',
    tags: ['#rust', '#ownership'],
    isStarred: true,
  },
  {
    id: 'snippet-6',
    title: 'Docker multi-stage build',
    tech: 'docker',
    updatedAt: '3d ago',
    codePreview: 'FROM node:20-alpine AS builder',
    tags: ['#docker', '#devops'],
    isStarred: false,
  },
  {
    id: 'snippet-7',
    title: 'React memo optimization',
    tech: 'react',
    updatedAt: '4d ago',
    codePreview: 'export const Card = memo(function Card({ item }) { ... });',
    tags: ['#react', '#perf'],
    isStarred: false,
  },
  {
    id: 'snippet-8',
    title: 'Tailwind custom tokens',
    tech: 'tailwindcss',
    updatedAt: '5d ago',
    codePreview: 'colors: { syntax: { accent: "#00eaff" } }',
    tags: ['#css', '#ui'],
    isStarred: false,
  },
  {
    id: 'snippet-9',
    title: 'PostgreSQL partial index',
    tech: 'postgresql',
    updatedAt: '1w ago',
    codePreview: 'CREATE INDEX idx_active_users ON users(email) WHERE active;',
    tags: ['#sql', '#postgres'],
    isStarred: false,
  },
];
