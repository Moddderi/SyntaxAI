import type { ReactElement } from 'react';
import type { Note } from '../../types/note';
import {
  computeUsageOverview,
  formatQuotaRemaining,
  getQuotaBarClass,
  getQuotaRemainingClass,
  type UsageQuota,
} from '../../utils/usageLimits';

interface UsageSectionProps {
  notes: Note[];
  isLoading: boolean;
}

const QUOTA_ICONS: Record<UsageQuota['id'], string> = {
  notes: '📝',
  context: '📄',
  photos: '📷',
};

function UsageQuotaRow({ quota }: { quota: UsageQuota }): ReactElement {
  const barClass = getQuotaBarClass(quota.tone);
  const remainingClass = getQuotaRemainingClass(quota.tone);

  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#1c1c20] bg-[#0d0d0f] text-lg"
      >
        {QUOTA_ICONS[quota.id]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{quota.label}</p>
            <p className="truncate text-xs text-gray-500">{quota.hint}</p>
          </div>
          <p className="shrink-0 tabular-nums text-sm text-gray-300">
            <span className="font-semibold text-white">{quota.used}</span>
            <span className="text-gray-500"> / {quota.limit}</span>
          </p>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#0d0d0f]">
          <div
            className={`h-full rounded-full transition-all ${barClass}`}
            style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
          />
        </div>
      </div>

      <p className={`w-24 shrink-0 text-right text-xs font-medium ${remainingClass}`}>
        {formatQuotaRemaining(quota)}
      </p>
    </div>
  );
}

function ProPlanCard(): ReactElement {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#00eaff]/20 bg-gradient-to-br from-[#00eaff]/10 via-[#141417] to-[#141417] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#00eaff]/10 blur-2xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00eaff]">
            Pro
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">No limits</h3>
          <p className="mt-1 max-w-md text-sm text-gray-400">
            Unlimited notes, page context, and photo reads — plus priority AI when it ships.
          </p>
        </div>

        <button
          className="rounded-full border border-[#00eaff]/30 bg-[#00eaff]/10 px-4 py-2 text-xs font-semibold text-[#00eaff] transition hover:bg-[#00eaff]/20"
          disabled
          type="button"
        >
          Coming soon
        </button>
      </div>
    </div>
  );
}

export function UsageSection({ notes, isLoading }: UsageSectionProps): ReactElement {
  const overview = computeUsageOverview(notes);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#1c1c20] bg-[#141417]">
      <div className="border-b border-[#1c1c20] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">{overview.planName}</h2>
            <p className="mt-0.5 text-sm text-gray-400">{overview.planTagline}</p>
          </div>
          <span className="rounded-full border border-[#1c1c20] bg-[#0d0d0f] px-3 py-1 text-[11px] text-gray-400">
            Free while in early access
          </span>
        </div>
      </div>

      <div className="px-5">
        {isLoading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={`usage-skeleton-${index}`}
                className="h-14 animate-pulse rounded-xl bg-[#0d0d0f]"
              />
            ))}
          </div>
        ) : overview.isPro ? (
          <div className="py-5 text-sm text-gray-400">
            You&apos;re on Pro — capture as much as you need.
          </div>
        ) : (
          <div className="divide-y divide-[#1c1c20]">
            {overview.quotas.map((quota) => (
              <UsageQuotaRow key={quota.id} quota={quota} />
            ))}
          </div>
        )}
      </div>

      {!overview.isPro ? (
        <div className="border-t border-[#1c1c20] p-4">
          <ProPlanCard />
        </div>
      ) : null}
    </section>
  );
}
