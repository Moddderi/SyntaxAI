import type { ReactElement } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { ChevronDownIcon } from './icons';

interface SidebarPlanPlaqueProps {
  billingEnabled: boolean;
  onClick: () => void;
}

export function SidebarPlanPlaque({
  billingEnabled,
  onClick,
}: SidebarPlanPlaqueProps): ReactElement {
  const { t } = useTranslation();

  const title = billingEnabled ? t('planFree') : t('planBeta');
  const hint = billingEnabled ? t('planUpgradeHint') : t('planBetaHint');

  return (
    <button
      className="mb-6 w-full rounded-xl border border-syntax-border bg-syntax-card px-3.5 py-3 text-left transition hover:border-syntax-accent/25 hover:bg-syntax-hover"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] leading-none text-syntax-text">{title}</span>
        <ChevronDownIcon className="h-4 w-4 text-syntax-muted" />
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-syntax-muted">{hint}</p>
    </button>
  );
}
