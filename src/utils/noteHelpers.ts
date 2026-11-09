import type { TechnologyNavItem, SnippetItem } from '../dashboard/types/dashboard.types';
import type { DetectedNote } from '../sidepanel/types/capture.types';
import type { Note, NoteSourceType } from '../types/note';
import { readCachedLocale, type Locale } from '../storage/localeStorage';
import { buildPlainTextPreview } from './markdownPreview';
import { resolveNoteTechnology } from './pageContextTechDetection';
import { formatTechnologyLabel, getTechBrandColor, resolveDeviconSlug } from './techIcon';

export function noteHasAiExplanation(note: Note): boolean {
  return Boolean(note.summary?.trim() || note.body?.trim());
}

function resolveLocale(locale?: Locale): Locale {
  return locale ?? readCachedLocale();
}

export function formatRelativeTime(isoDate: string, locale?: Locale): string {
  const resolved = resolveLocale(locale);
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) {
    return resolved === 'uk' ? 'щойно' : 'just now';
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return resolved === 'uk' ? 'щойно' : 'just now';
  }

  if (diffMinutes < 60) {
    return resolved === 'uk' ? `${diffMinutes} хв тому` : `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return resolved === 'uk' ? `${diffHours} год тому` : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return resolved === 'uk' ? `${diffDays} дн тому` : `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return resolved === 'uk' ? `${diffWeeks} тиж тому` : `${diffWeeks}w ago`;
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

export function formatNoteDate(isoDate: string, locale?: Locale): string {
  const resolved = resolveLocale(locale);
  const tag = resolved === 'uk' ? 'uk-UA' : 'en-US';

  return new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatTopicLabel(topic: string): string {
  return topic.replace(/^#+/, '').trim();
}

export function noteToSnippetItem(note: Note, locale?: Locale): SnippetItem {
  const resolvedTech = resolveNoteTechnology({
    title: note.title,
    code: note.code,
    body: note.body,
    sourceUrl: note.sourceUrl,
    language: note.language,
    preferredPrimaryTech: note.primaryTech,
  });

  return {
    id: note.id,
    title: note.title,
    primaryTech: resolvedTech.primaryTech,
    language: resolvedTech.language,
    code: note.code,
    updatedAt: formatRelativeTime(note.createdAt, locale),
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
    preferredPrimaryTech: detected.primaryTech,
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
    updatedAt: new Date().toISOString(),
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
  stack: number;
  trash: number;
} {
  const techSlugs = new Set(
    notes.map((note) => resolveDeviconSlug(note.primaryTech)),
  );

  return {
    all: notes.length,
    starred: notes.filter((note) => note.isStarred).length,
    stack: techSlugs.size,
    trash: trashCount,
  };
}

export interface StackTechItem {
  slug: string;
  label: string;
  count: number;
  lastActivityAt: string;
  brandColor: string;
}

export function computeStackTechItems(notes: Note[]): StackTechItem[] {
  const aggregates = new Map<string, { count: number; lastActivityAt: string }>();

  notes.forEach((note) => {
    const slug = resolveDeviconSlug(note.primaryTech);
    const existing = aggregates.get(slug);

    if (!existing) {
      aggregates.set(slug, { count: 1, lastActivityAt: note.createdAt });
      return;
    }

    existing.count += 1;

    if (note.createdAt > existing.lastActivityAt) {
      existing.lastActivityAt = note.createdAt;
    }
  });

  return Array.from(aggregates.entries())
    .sort((left, right) => {
      if (right[1].count !== left[1].count) {
        return right[1].count - left[1].count;
      }

      return right[1].lastActivityAt.localeCompare(left[1].lastActivityAt);
    })
    .map(([slug, data]) => ({
      slug,
      label: formatTechnologyLabel(slug),
      count: data.count,
      lastActivityAt: data.lastActivityAt,
      brandColor: getTechBrandColor(slug),
    }));
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
