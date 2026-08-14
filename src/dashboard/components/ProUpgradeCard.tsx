import type { ReactElement } from 'react';
import {
  FREE_PLAN_FEATURES,
  PRO_PLAN,
  PRO_PLAN_FEATURES,
} from '../../utils/usageLimits';
import { openPricingPage } from '../../utils/openPricingPage';

interface ProUpgradeCardProps {
  variant?: 'compact' | 'full';
  onUpgradeClick?: () => void;
}

export function ProUpgradeCard({
  variant = 'full',
  onUpgradeClick = openPricingPage,
}: ProUpgradeCardProps): ReactElement {
  if (variant === 'compact') {
    return (
      <div className="rounded-2xl border border-syntax-accent/25 bg-gradient-to-br from-syntax-accent/12 to-transparent p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-accent">
              SyntaxAI Pro
            </p>
            <p className="mt-1 text-sm font-semibold text-syntax-text">Remove all limits</p>
            <p className="mt-1 text-xs text-syntax-muted">
              {PRO_PLAN.priceLabel}
              {PRO_PLAN.periodLabel}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full bg-syntax-accent px-3 py-1.5 text-[11px] font-semibold text-black transition hover:bg-syntax-accent/90"
            onClick={onUpgradeClick}
            type="button"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-syntax-accent/20 bg-gradient-to-br from-syntax-accent/10 via-syntax-card to-syntax-card p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-syntax-accent/10 blur-2xl" />

      <div className="relative grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-accent">
            SyntaxAI Pro
          </p>
          <div className="mt-2 flex items-end gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-syntax-text">
              {PRO_PLAN.priceLabel}
            </span>
            <span className="pb-1 text-sm text-syntax-muted">{PRO_PLAN.periodLabel}</span>
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-syntax-muted">
            Capture everything you learn while coding — no caps, no deleting old notes to make
            room.
          </p>

          <ul className="mt-4 space-y-2">
            {PRO_PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-syntax-muted">
                <span aria-hidden="true" className="mt-0.5 text-syntax-accent">
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            className="mt-5 h-11 rounded-full bg-syntax-accent px-6 text-sm font-semibold text-black transition hover:bg-syntax-accent/90"
            onClick={onUpgradeClick}
            type="button"
          >
            Upgrade to Pro
          </button>
          <p className="mt-2 text-[11px] text-syntax-muted">syntaxai.app/pricing</p>
        </div>

        <div className="rounded-xl border border-syntax-border bg-syntax-inset/80 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-syntax-muted">
            Free vs Pro
          </p>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-syntax-muted">Free</p>
              <ul className="space-y-1.5">
                {FREE_PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="text-xs text-syntax-muted">
                    · {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-syntax-border pt-3">
              <p className="mb-2 text-xs font-medium text-syntax-accent">Pro</p>
              <ul className="space-y-1.5">
                {PRO_PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="text-xs text-syntax-muted">
                    · {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
