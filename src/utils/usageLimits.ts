import type { Note } from '../types/note';

export const FREE_PLAN_LIMITS = {
  notes: 30,
  contextSaves: 10,
  photoReads: 10,
} as const;

export const PRO_PLAN = {
  priceLabel: '$4.99',
  periodLabel: '/ month',
  priceMonthly: 4.99,
} as const;

export const PRO_PLAN_FEATURES = [
  'Unlimited notes in your library',
  'Unlimited page context captures',
  'Unlimited photo & screenshot reads',
  'Priority AI — faster titles, tags, and stack detection',
] as const;

export const FREE_PLAN_FEATURES = [
  `${FREE_PLAN_LIMITS.notes} saved notes`,
  `${FREE_PLAN_LIMITS.contextSaves} page context captures`,
  `${FREE_PLAN_LIMITS.photoReads} photo reads`,
  'Smart titles, tags, and stack detection',
] as const;

export type UsageQuotaId = 'notes' | 'context' | 'photos';

export type UsageLimitId = UsageQuotaId;

export interface UsageLimitCheck {
  allowed: boolean;
  limitId: UsageLimitId | null;
  message: string | null;
}

export type UsageQuotaTone = 'comfortable' | 'watch' | 'full';

export interface UsageQuota {
  id: UsageQuotaId;
  label: string;
  shortLabel: string;
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
  headlineRemaining: string;
  urgencyMessage: string | null;
  primaryQuota: UsageQuota;
}

export interface SidebarUsageSnapshot {
  notesUsed: number;
  notesLimit: number;
  notesPercent: number;
  headline: string;
  subline: string;
  urgency: UsageQuotaTone;
  quotas: UsageQuota[];
}

function getUsageTone(used: number, limit: number): UsageQuotaTone {
  const ratio = limit > 0 ? used / limit : 0;

  if (ratio >= 1) {
    return 'full';
  }

  if (ratio >= 0.75) {
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

function countContextNotes(notes: Note[]): number {
  return notes.filter(hasContextBody).length;
}

function countPhotoNotes(notes: Note[]): number {
  return notes.filter(isPhotoNote).length;
}

export function isProPlanActive(): boolean {
  return false;
}

export function checkCanSaveNote(
  notes: Note[],
  options: { includesContextBody: boolean; isPhotoSource: boolean },
): UsageLimitCheck {
  if (isProPlanActive()) {
    return { allowed: true, limitId: null, message: null };
  }

  if (notes.length >= FREE_PLAN_LIMITS.notes) {
    return {
      allowed: false,
      limitId: 'notes',
      message: 'Your notebook is full. Upgrade to Pro to keep capturing without deleting notes.',
    };
  }

  if (
    options.includesContextBody &&
    countContextNotes(notes) >= FREE_PLAN_LIMITS.contextSaves
  ) {
    return {
      allowed: false,
      limitId: 'context',
      message: 'Page context limit reached. Pro unlocks unlimited docs and rules capture.',
    };
  }

  if (options.isPhotoSource && countPhotoNotes(notes) >= FREE_PLAN_LIMITS.photoReads) {
    return {
      allowed: false,
      limitId: 'photos',
      message: 'Photo read limit reached. Pro lets you scan unlimited screenshots.',
    };
  }

  return { allowed: true, limitId: null, message: null };
}

export function checkCanRunPhotoAnalysis(notes: Note[]): UsageLimitCheck {
  if (isProPlanActive()) {
    return { allowed: true, limitId: null, message: null };
  }

  if (countPhotoNotes(notes) >= FREE_PLAN_LIMITS.photoReads) {
    return {
      allowed: false,
      limitId: 'photos',
      message: 'Photo read limit reached. Pro lets you scan unlimited screenshots.',
    };
  }

  return { allowed: true, limitId: null, message: null };
}

export function checkCanRunContextAnalysis(notes: Note[]): UsageLimitCheck {
  if (isProPlanActive()) {
    return { allowed: true, limitId: null, message: null };
  }

  if (countContextNotes(notes) >= FREE_PLAN_LIMITS.contextSaves) {
    return {
      allowed: false,
      limitId: 'context',
      message: 'Page context limit reached. Pro unlocks unlimited docs and rules capture.',
    };
  }

  return { allowed: true, limitId: null, message: null };
}

function buildQuota(
  id: UsageQuotaId,
  label: string,
  shortLabel: string,
  hint: string,
  used: number,
  limit: number,
): UsageQuota {
  const remaining = Math.max(limit - used, 0);
  const percentUsed = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;

  return {
    id,
    label,
    shortLabel,
    hint,
    used,
    limit,
    remaining,
    percentUsed,
    tone: getUsageTone(used, limit),
  };
}

function buildUrgencyMessage(quotas: UsageQuota[]): string | null {
  const fullQuota = quotas.find((quota) => quota.tone === 'full');

  if (fullQuota) {
    if (fullQuota.id === 'notes') {
      return 'Your notebook is full. Upgrade to Pro to keep capturing without deleting notes.';
    }

    if (fullQuota.id === 'context') {
      return 'Page context limit reached. Pro unlocks unlimited docs and rules capture.';
    }

    return 'Photo read limit reached. Pro lets you scan unlimited screenshots.';
  }

  const watchQuota = quotas.find((quota) => quota.tone === 'watch');

  if (watchQuota) {
    return `Running low on ${watchQuota.shortLabel.toLowerCase()} — Pro removes all caps.`;
  }

  return null;
}

function buildHeadlineRemaining(primaryQuota: UsageQuota): string {
  if (primaryQuota.remaining <= 0) {
    return 'Limit reached';
  }

  if (primaryQuota.id === 'notes') {
    return primaryQuota.remaining === 1 ? '1 note left' : `${primaryQuota.remaining} notes left`;
  }

  if (primaryQuota.id === 'context') {
    return primaryQuota.remaining === 1
      ? '1 context left'
      : `${primaryQuota.remaining} contexts left`;
  }

  return primaryQuota.remaining === 1 ? '1 photo left' : `${primaryQuota.remaining} photos left`;
}

function getPrimaryQuota(quotas: UsageQuota[]): UsageQuota {
  const sorted = [...quotas].sort((left, right) => {
    if (left.percentUsed !== right.percentUsed) {
      return right.percentUsed - left.percentUsed;
    }

    return right.used - left.used;
  });

  return sorted[0] ?? quotas[0];
}

export function computeUsageOverview(notes: Note[]): UsageOverview {
  const isPro = isProPlanActive();

  if (isPro) {
    return {
      planName: 'SyntaxAI Pro',
      planTagline: 'Unlimited notes, context, and photo reads.',
      quotas: [],
      isPro: true,
      headlineRemaining: 'Unlimited',
      urgencyMessage: null,
      primaryQuota: buildQuota('notes', 'Saved notes', 'Notes', '', 0, 1),
    };
  }

  const quotas = [
    buildQuota(
      'notes',
      'Saved notes',
      'Notes',
      'Any capture saved to your library',
      notes.length,
      FREE_PLAN_LIMITS.notes,
    ),
    buildQuota(
      'context',
      'Page context',
      'Context',
      'Notes with docs, rules, or page text',
      notes.filter(hasContextBody).length,
      FREE_PLAN_LIMITS.contextSaves,
    ),
    buildQuota(
      'photos',
      'Photo reads',
      'Photos',
      'Screenshots and images read by AI',
      notes.filter(isPhotoNote).length,
      FREE_PLAN_LIMITS.photoReads,
    ),
  ];

  const primaryQuota = getPrimaryQuota(quotas);

  return {
    planName: 'Free plan',
    planTagline: 'Start free — upgrade when your library grows.',
    quotas,
    isPro: false,
    headlineRemaining: buildHeadlineRemaining(primaryQuota),
    urgencyMessage: buildUrgencyMessage(quotas),
    primaryQuota,
  };
}

export function computeSidebarUsageSnapshot(notes: Note[]): SidebarUsageSnapshot {
  const overview = computeUsageOverview(notes);
  const notesQuota =
    overview.quotas.find((quota) => quota.id === 'notes') ?? overview.primaryQuota;

  let subline = `${notesQuota.used} of ${notesQuota.limit} notes saved`;

  if (overview.urgencyMessage) {
    subline = overview.urgencyMessage;
  } else if (notesQuota.remaining <= 5) {
    subline = `Only ${notesQuota.remaining} spots left on Free`;
  }

  return {
    notesUsed: notesQuota.used,
    notesLimit: notesQuota.limit,
    notesPercent: notesQuota.percentUsed,
    headline: buildHeadlineRemaining(notesQuota),
    subline,
    urgency: notesQuota.tone,
    quotas: overview.quotas,
  };
}

export function getQuotaBarClass(tone: UsageQuotaTone): string {
  switch (tone) {
    case 'full':
      return 'bg-red-400';
    case 'watch':
      return 'bg-amber-400';
    default:
      return 'bg-syntax-accent';
  }
}

export function getQuotaRemainingClass(tone: UsageQuotaTone): string {
  switch (tone) {
    case 'full':
      return 'text-red-300';
    case 'watch':
      return 'text-amber-300';
    default:
      return 'text-syntax-accent';
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

export function formatNavUsageBadge(notesUsed: number, notesLimit: number): string {
  return `${notesUsed}/${notesLimit}`;
}
