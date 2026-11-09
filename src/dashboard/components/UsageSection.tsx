import type { ReactElement } from 'react';
import type { Note } from '../../types/note';
import { useAuthSession } from '../../hooks/useAuthSession';
import {
  computeUsageOverview,
  formatQuotaRemaining,
  getQuotaBarClass,
  getQuotaRemainingClass,
  type UsageQuota,
} from '../../utils/usageLimits';
import { openPricingPage } from '../../utils/openPricingPage';
import { ProUpgradeCard } from './ProUpgradeCard';

interface UsageSectionProps {
  notes: Note[];
  isLoading: boolean;
  onUpgradeClick?: () => void;
}

function UsageQuotaRow({ quota }: { quota: UsageQuota }): ReactElement {
  const barClass = getQuotaBarClass(quota.tone);
  const remainingClass = getQuotaRemainingClass(quota.tone);

  return (
    <div className="rounded-xl border border-syntax-border bg-syntax-inset p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-syntax-text">{quota.label}</p>
          <p className="mt-0.5 text-xs text-syntax-muted">{quota.hint}</p>
        </div>
        <p className={`text-xs font-medium ${remainingClass}`}>
          {formatQuotaRemaining(quota)}
        </p>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs tabular-nums">
        <span className="text-syntax-muted">
          <span className="font-semibold text-syntax-text">{quota.used}</span>
          <span className="text-syntax-muted"> / {quota.limit}</span>
        </span>
        <span className="text-syntax-muted">{quota.percentUsed}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-syntax-card">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function UsageSection({
  notes,
  isLoading,
  onUpgradeClick = openPricingPage,
}: UsageSectionProps): ReactElement | null {
  const { billingEnabled } = useAuthSession();
  const overview = computeUsageOverview(notes);

  // Beta: hide Free/Pro quota sales card — AnalyticsView still shows real stats.
  if (!billingEnabled) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-syntax-border bg-syntax-card">
      <div className="border-b border-syntax-border px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-accent">
              Your plan
            </p>
            <h2 className="mt-1 text-xl font-semibold text-syntax-text">{overview.planName}</h2>
            <p className="mt-1 max-w-xl text-sm text-syntax-muted">{overview.planTagline}</p>
          </div>

          {!overview.isPro ? (
            <div className="rounded-2xl border border-syntax-border bg-syntax-inset px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.14em] text-syntax-muted">
                Notebook room
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-syntax-text">
                {isLoading ? '—' : overview.headlineRemaining}
              </p>
            </div>
          ) : null}
        </div>

        {overview.urgencyMessage ? (
          <p className="syntax-urgency-banner mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm">
            {overview.urgencyMessage}
          </p>
        ) : null}
      </div>

      <div className="px-5 py-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={`usage-skeleton-${index}`}
                className="h-28 animate-pulse rounded-xl bg-syntax-inset"
              />
            ))}
          </div>
        ) : overview.isPro ? (
          <div className="text-sm text-syntax-muted">
            You&apos;re on Pro — capture as much as you need.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {overview.quotas.map((quota) => (
              <UsageQuotaRow key={quota.id} quota={quota} />
            ))}
          </div>
        )}
      </div>

      {!overview.isPro ? (
        <div className="border-t border-syntax-border p-4">
          <ProUpgradeCard onUpgradeClick={onUpgradeClick} />
        </div>
      ) : null}
    </section>
  );
}
