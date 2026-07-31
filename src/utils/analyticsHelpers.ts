import type { Note } from '../types/note';
import { resolveDeviconSlug } from './techIcon';

const RECENT_DAYS = 7;
const HEATMAP_WEEKS = 16;
const MINUTES_SAVED_PER_NOTE = 15;

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export interface LanguageBreakdownItem {
  name: string;
  slug: string;
  count: number;
  percentage: number;
}

export interface HeatmapCell {
  date: Date;
  dateKey: string;
  count: number;
  isFuture: boolean;
}

export interface ActivityHeatmapData {
  weeks: number;
  grid: HeatmapCell[][];
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
}

export interface InputMethodBreakdown {
  code: number;
  image: number;
  tab: number;
}

export const ANALYTICS_CHART_COLORS = [
  '#00eaff',
  '#00b8d4',
  '#0099cc',
  '#22d3ee',
  '#34d399',
  '#a78bfa',
  '#f472b6',
  '#fbbf24',
] as const;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonday(date: Date): Date {
  const normalized = startOfDay(date);
  const weekday = normalized.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  normalized.setDate(normalized.getDate() + diff);
  return normalized;
}

function buildDailyCounts(notes: Note[]): Map<string, number> {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    const key = formatDateKey(new Date(note.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return counts;
}

function formatLanguageLabel(slug: string): string {
  if (slug === 'typescript') {
    return 'TypeScript';
  }

  if (slug === 'postgresql') {
    return 'SQL';
  }

  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function filterNotesByLibraryTab(
  notes: Note[],
  tab: 'all' | 'starred' | 'recent' | 'trash',
): Note[] {
  if (tab === 'starred') {
    return notes.filter((note) => note.isStarred);
  }

  if (tab === 'recent') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - RECENT_DAYS);
    return notes.filter((note) => new Date(note.createdAt) >= weekAgo);
  }

  if (tab === 'trash') {
    return [];
  }

  return notes;
}

export function computeLanguageBreakdown(notes: Note[]): LanguageBreakdownItem[] {
  if (notes.length === 0) {
    return [];
  }

  const counts = new Map<string, number>();

  notes.forEach((note) => {
    const slug = resolveDeviconSlug(note.primaryTech);
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([slug, count]) => ({
      name: formatLanguageLabel(slug),
      slug,
      count,
      percentage: Math.round((count / notes.length) * 100),
    }));
}

export function computeCurrentStreak(notes: Note[]): number {
  const dailyCounts = buildDailyCounts(notes);
  let streak = 0;
  const cursor = startOfDay(new Date());

  const todayKey = formatDateKey(cursor);
  if ((dailyCounts.get(todayKey) ?? 0) === 0) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while ((dailyCounts.get(formatDateKey(cursor)) ?? 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function computeLongestStreak(notes: Note[]): number {
  const dailyCounts = buildDailyCounts(notes);
  const activeDays = Array.from(dailyCounts.entries())
    .filter(([, count]) => count > 0)
    .map(([dateKey]) => dateKey)
    .sort();

  if (activeDays.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < activeDays.length; index += 1) {
    const previous = new Date(activeDays[index - 1]);
    const currentDay = new Date(activeDays[index]);
    const diffDays =
      (currentDay.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function computeActivityHeatmap(notes: Note[]): ActivityHeatmapData {
  const dailyCounts = buildDailyCounts(notes);
  const today = startOfDay(new Date());
  const currentWeekMonday = getMonday(today);
  const startMonday = new Date(currentWeekMonday);
  startMonday.setDate(startMonday.getDate() - (HEATMAP_WEEKS - 1) * 7);

  const grid: HeatmapCell[][] = WEEKDAY_LABELS.map(() => []);

  for (let weekIndex = 0; weekIndex < HEATMAP_WEEKS; weekIndex += 1) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cellDate = new Date(startMonday);
      cellDate.setDate(cellDate.getDate() + weekIndex * 7 + dayIndex);

      const dateKey = formatDateKey(cellDate);
      const count = dailyCounts.get(dateKey) ?? 0;
      const isFuture = cellDate.getTime() > today.getTime();

      grid[dayIndex][weekIndex] = {
        date: cellDate,
        dateKey,
        count: isFuture ? 0 : count,
        isFuture,
      };
    }
  }

  const activeDays = Array.from(dailyCounts.values()).filter((count) => count > 0).length;

  return {
    weeks: HEATMAP_WEEKS,
    grid,
    currentStreak: computeCurrentStreak(notes),
    longestStreak: computeLongestStreak(notes),
    activeDays,
  };
}

export function getHeatmapCellClass(count: number, isFuture: boolean): string {
  if (isFuture) {
    return 'bg-transparent border border-transparent opacity-0';
  }

  if (count === 0) {
    return 'bg-[#18181c] border border-[#222226]';
  }

  if (count <= 2) {
    return 'bg-[#00eaff]/25 border border-[#00eaff]/10';
  }

  if (count <= 4) {
    return 'bg-[#00eaff]/60 border border-[#00eaff]/20';
  }

  return 'bg-[#00eaff] border border-[#00eaff] shadow-[0_0_10px_#00eaff]';
}

export function formatHeatmapDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function computeEstimatedTimeSavedHours(notes: Note[]): number {
  const totalMinutes = notes.length * MINUTES_SAVED_PER_NOTE;
  return Math.round((totalMinutes / 60) * 10) / 10;
}

export function computeInputMethodBreakdown(notes: Note[]): InputMethodBreakdown {
  return notes.reduce<InputMethodBreakdown>(
    (breakdown, note) => {
      const sourceType = note.sourceType ?? 'code';

      if (sourceType === 'image') {
        breakdown.image += 1;
      } else if (sourceType === 'tab') {
        breakdown.tab += 1;
      } else {
        breakdown.code += 1;
      }

      return breakdown;
    },
    { code: 0, image: 0, tab: 0 },
  );
}

export function getLibraryTabTitle(tab: string): string {
  switch (tab) {
    case 'starred':
      return 'Starred notes';
    case 'recent':
      return 'Recent notes';
    case 'trash':
      return 'Trash';
    default:
      return 'All notes';
  }
}
