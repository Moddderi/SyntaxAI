import type { ReactElement } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import type { UsageLimitId } from '../utils/usageLimits';
import { openPricingPage } from '../utils/openPricingPage';

interface UpgradeLimitBannerProps {
  limitId: UsageLimitId;
  message?: string | null;
}

export function UpgradeLimitBanner({
  limitId,
  message,
}: UpgradeLimitBannerProps): ReactElement {
  const { t } = useTranslation();

  const fallbackMessage =
    limitId === 'notes'
      ? t('limitNotesMessage')
      : limitId === 'context'
        ? t('limitContextMessage')
        : t('limitPhotosMessage');

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
      <p className="text-sm leading-relaxed text-syntax-text">{message ?? fallbackMessage}</p>
      <button
        className="mt-3 h-9 rounded-full bg-syntax-accent px-4 text-xs font-semibold text-black transition hover:bg-syntax-accent/90"
        onClick={openPricingPage}
        type="button"
      >
        {t('limitUpgradeButton')}
      </button>
    </div>
  );
}
