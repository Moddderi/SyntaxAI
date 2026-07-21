import type { LanguageFilterId } from '../sidepanel/types/capture.types';
import type { LanguageNavItem, SnippetItem, StatCardItem } from '../dashboard/types/dashboard.types';
import type { DetectedNote } from '../sidepanel/types/capture.types';
import type { Note } from '../types/note';
import { resolveDeviconSlug } from './techIcon';

const LANGUAGE_FILTER_MAP: Record<string, LanguageFilterId> = {
  typescript: 'ts',
  python: 'py',
  go: 'go',
  postgresql: 'sql',
  rust: 'rs',
};

const RECENT_DAYS = 7;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(left: Date, right: Date): boolean {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) {
    return 'just now';
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

export function getCodePreview(code: string): string {
  const firstLine =
    code.split('\n').find((line) => line.trim().length > 0) ?? code;

  return firstLine.trim();
}

export function noteToSnippetItem(note: Note): SnippetItem {
  return {
    id: note.id,
    title: note.title,
    tech: resolveDeviconSlug(note.language),
    updatedAt: formatRelativeTime(note.createdAt),
    codePreview: getCodePreview(note.code),
    tags: note.tags,
    isStarred: note.isStarred,
  };
}

export function noteLanguageToFilterId(language: string): LanguageFilterId {
  const slug = resolveDeviconSlug(language);
  return LANGUAGE_FILTER_MAP[slug] ?? 'all';
}

export function buildNoteFromCapture(code: string, detected: DetectedNote): Note {
  return {
    id: crypto.randomUUID(),
    title: detected.title,
    code,
    language: resolveDeviconSlug(detected.technologyLabel),
    tags: detected.tags,
    createdAt: new Date().toISOString(),
    isStarred: false,
  };
}

export function computeStatCards(notes: Note[]): StatCardItem[] {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - RECENT_DAYS);

  const notesThisWeek = notes.filter(
    (note) => new Date(note.createdAt) >= weekAgo,
  ).length;

  const notesToday = notes.filter((note) =>
    isSameDay(new Date(note.createdAt), now),
  ).length;

  const uniqueLanguages = new Set(
    notes.map((note) => resolveDeviconSlug(note.language)),
  ).size;

  return [
    {
      id: 'total-notes',
      label: 'Total Notes',
      value: String(notes.length),
      hint: notesThisWeek > 0 ? `+${notesThisWeek} this week` : 'start adding notes',
    },
    {
      id: 'languages',
      label: 'Languages',
      value: String(uniqueLanguages),
      hint: 'across your stack',
    },
    {
      id: 'notes-today',
      label: 'Notes Today',
      value: String(notesToday),
      hint: notesToday > 0 ? 'active note day' : 'no notes yet today',
    },
    {
      id: 'ai-credits',
      label: 'AI Credits',
      value: '847',
      hint: 'credits remaining',
    },
  ];
}

export function computeLibraryNavCounts(notes: Note[]): {
  all: number;
  starred: number;
  recent: number;
  tags: number;
} {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - RECENT_DAYS);

  const uniqueTags = new Set(
    notes.flatMap((note) => note.tags.map((tag) => tag.toLowerCase())),
  );

  return {
    all: notes.length,
    starred: notes.filter((note) => note.isStarred).length,
    recent: notes.filter((note) => new Date(note.createdAt) >= weekAgo).length,
    tags: uniqueTags.size,
  };
}

export function computeLanguageNavItems(notes: Note[]): LanguageNavItem[] {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    const slug = resolveDeviconSlug(note.language);
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([slug, count]) => ({
      id: slug,
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
      tech: slug,
      count,
    }));
}
