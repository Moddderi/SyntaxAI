import type { LanguageFilterId } from '../sidepanel/types/capture.types';
import type { TechnologyNavItem, SnippetItem, StatCardItem } from '../dashboard/types/dashboard.types';
import type { DetectedNote } from '../sidepanel/types/capture.types';
import type { Note, NoteSourceType } from '../types/note';
import { formatTechnologyLabel, resolveDeviconSlug } from './techIcon';

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

export function formatNoteDate(isoDate: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatTopicLabel(topic: string): string {
  const normalized = topic.replace(/^#+/, '').trim();
  return normalized ? `#${normalized}` : '';
}

export function noteToSnippetItem(note: Note): SnippetItem {
  return {
    id: note.id,
    title: note.title,
    primaryTech: resolveDeviconSlug(note.primaryTech),
    language: resolveDeviconSlug(note.language),
    code: note.code,
    updatedAt: formatRelativeTime(note.createdAt),
    codePreview: getCodePreview(note.code),
    topics: note.topics,
    isStarred: note.isStarred,
  };
}

export function noteLanguageToFilterId(language: string): LanguageFilterId {
  const slug = resolveDeviconSlug(language);
  return LANGUAGE_FILTER_MAP[slug] ?? 'all';
}

export function buildNoteFromCapture(
  code: string,
  detected: DetectedNote,
  sourceType: NoteSourceType = 'code',
): Note {
  return {
    id: crypto.randomUUID(),
    title: detected.title,
    code: detected.code || code,
    primaryTech: resolveDeviconSlug(detected.primaryTech),
    language: resolveDeviconSlug(detected.language),
    topics: detected.topics,
    summary: detected.summary?.trim() || undefined,
    createdAt: new Date().toISOString(),
    isStarred: false,
    isDeleted: false,
    sourceType,
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

  const uniqueTechnologies = new Set(
    notes.map((note) => resolveDeviconSlug(note.primaryTech)),
  ).size;

  return [
    {
      id: 'total-notes',
      label: 'Total Notes',
      value: String(notes.length),
      hint: notesThisWeek > 0 ? `+${notesThisWeek} this week` : 'start adding notes',
    },
    {
      id: 'technologies',
      label: 'Technologies',
      value: String(uniqueTechnologies),
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

export function computeLibraryNavCounts(
  notes: Note[],
  trashCount = 0,
): {
  all: number;
  starred: number;
  recent: number;
  trash: number;
} {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - RECENT_DAYS);

  return {
    all: notes.length,
    starred: notes.filter((note) => note.isStarred).length,
    recent: notes.filter((note) => new Date(note.createdAt) >= weekAgo).length,
    trash: trashCount,
  };
}

export function searchNotes(notes: Note[], query: string): Note[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return notes;
  }

  return notes.filter((note) => {
    const searchable = [
      note.title,
      note.code,
      note.primaryTech,
      note.language,
      ...note.topics,
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });
}

export function filterNotesByTechnology(notes: Note[], techSlug: string | null): Note[] {
  if (!techSlug) {
    return notes;
  }

  return notes.filter(
    (note) => resolveDeviconSlug(note.primaryTech) === techSlug,
  );
}

export function computeTechnologyNavItems(notes: Note[]): TechnologyNavItem[] {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    const slug = resolveDeviconSlug(note.primaryTech);
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([slug, count]) => ({
      id: slug,
      label: formatTechnologyLabel(slug),
      tech: slug,
      count,
    }));
}

/** @deprecated Use computeTechnologyNavItems */
export function computeLanguageNavItems(notes: Note[]): TechnologyNavItem[] {
  return computeTechnologyNavItems(notes);
}
