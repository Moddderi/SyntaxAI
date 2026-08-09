import type { TechnologyNavItem, SnippetItem } from '../dashboard/types/dashboard.types';
import type { DetectedNote } from '../sidepanel/types/capture.types';
import type { Note, NoteSourceType } from '../types/note';
import { buildPlainTextPreview } from './markdownPreview';
import { resolveNoteTechnology } from './pageContextTechDetection';
import { formatTechnologyLabel, resolveDeviconSlug } from './techIcon';

const RECENT_DAYS = 7;

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

export function getNotePreviewLine(
  summary: string | undefined,
  code: string,
  body?: string,
): string {
  const preview = buildPlainTextPreview(summary, body);

  if (preview) {
    return preview;
  }

  return getCodePreview(code);
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
  const resolvedTech = resolveNoteTechnology({
    title: note.title,
    code: note.code,
    body: note.body,
    sourceUrl: note.sourceUrl,
    language: note.language,
  });

  return {
    id: note.id,
    title: note.title,
    primaryTech: resolvedTech.primaryTech,
    language: resolvedTech.language,
    code: note.code,
    updatedAt: formatRelativeTime(note.createdAt),
    codePreview: getCodePreview(note.code),
    summary: note.summary,
    previewLine: getNotePreviewLine(note.summary, note.code, note.body),
    topics: note.topics,
    isStarred: note.isStarred,
  };
}

export function buildNoteFromCapture(
  code: string,
  detected: DetectedNote,
  sourceType: NoteSourceType = 'code',
  sourceUrl?: string,
  body?: string,
): Note {
  const resolvedBody = body?.trim() || undefined;
  const resolvedTech = resolveNoteTechnology({
    title: detected.title,
    code: detected.code || code,
    body: resolvedBody,
    sourceUrl,
    language: detected.language,
  });

  return {
    id: crypto.randomUUID(),
    title: detected.title,
    code: detected.code || code,
    primaryTech: resolvedTech.primaryTech,
    language: resolvedTech.language,
    topics: detected.topics,
    summary: detected.summary?.trim() || undefined,
    body: resolvedBody,
    sourceUrl: sourceUrl?.trim() || undefined,
    createdAt: new Date().toISOString(),
    isStarred: false,
    isDeleted: false,
    sourceType,
  };
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
