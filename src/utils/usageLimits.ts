import type { Note } from '../types/note';

export const FREE_PLAN_LIMITS = {
  notes: 30,
  contextSaves: 10,
  photoReads: 10,
} as const;

export type UsageQuotaId = 'notes' | 'context' | 'photos';

export type UsageQuotaTone = 'comfortable' | 'watch' | 'full';

export interface UsageQuota {
  id: UsageQuotaId;
  label: string;
  hint: string;
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  tone: UsageQuotaTone;
}

export interface UsageOverview {
  planName: string;
  planTagline: string;
  quotas: UsageQuota[];
  isPro: boolean;
}

function getUsageTone(used: number, limit: number): UsageQuotaTone {
  const ratio = limit > 0 ? used / limit : 0;

  if (ratio >= 1) {
    return 'full';
  }

  if (ratio >= 0.8) {
    return 'watch';
  }

  return 'comfortable';
}

function hasContextBody(note: Note): boolean {
  return (note.body?.trim().length ?? 0) > 0;
}

function isPhotoNote(note: Note): boolean {
  return note.sourceType === 'image';
}

function buildQuota(
  id: UsageQuotaId,
  label: string,
  hint: string,
  used: number,
  limit: number,
): UsageQuota {
  const cappedUsed = Math.min(used, limit);
  const remaining = Math.max(limit - used, 0);
  const percentUsed = limit > 0 ? Math.round((cappedUsed / limit) * 100) : 0;

  return {
    id,
    label,
    hint,
    used: cappedUsed,
    limit,
    remaining,
    percentUsed,
    tone: getUsageTone(used, limit),
  };
}

export function computeUsageOverview(notes: Note[]): UsageOverview {
  const isPro = false;

  if (isPro) {
    return {
      planName: 'SyntaxAI Pro',
      planTagline: 'Unlimited notes, context, and photo reads.',
      quotas: [],
      isPro: true,
    };
  }

  const contextUsed = notes.filter(hasContextBody).length;
  const photoUsed = notes.filter(isPhotoNote).length;

  return {
    planName: 'Free plan',
    planTagline: '30 notes to start. Context and photo reads have their own caps.',
    quotas: [
      buildQuota(
        'notes',
        'Saved notes',
        'Any capture saved to your library',
        notes.length,
        FREE_PLAN_LIMITS.notes,
      ),
      buildQuota(
        'context',
        'Page context',
        'Notes with docs, rules, or page text',
        contextUsed,
        FREE_PLAN_LIMITS.contextSaves,
      ),
      buildQuota(
        'photos',
        'Photo reads',
        'Screenshots and images read by AI',
        photoUsed,
        FREE_PLAN_LIMITS.photoReads,
      ),
    ],
    isPro: false,
  };
}

export function getQuotaBarClass(tone: UsageQuotaTone): string {
  switch (tone) {
    case 'full':
      return 'bg-red-400';
    case 'watch':
      return 'bg-amber-400';
    default:
      return 'bg-[#00eaff]';
  }
}

export function getQuotaRemainingClass(tone: UsageQuotaTone): string {
  switch (tone) {
    case 'full':
      return 'text-red-300';
    case 'watch':
      return 'text-amber-300';
    default:
      return 'text-[#00eaff]';
  }
}

export function formatQuotaRemaining(quota: UsageQuota): string {
  if (quota.remaining <= 0) {
    return 'Limit reached';
  }

  if (quota.id === 'notes') {
    return quota.remaining === 1 ? '1 note left' : `${quota.remaining} notes left`;
  }

  if (quota.id === 'context') {
    return quota.remaining === 1 ? '1 context left' : `${quota.remaining} contexts left`;
  }

  return quota.remaining === 1 ? '1 photo left' : `${quota.remaining} photos left`;
}
