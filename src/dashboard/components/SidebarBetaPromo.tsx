import type { ReactElement } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { SparklesIcon } from './icons';

interface SidebarBetaPromoProps {
  billingEnabled: boolean;
  onClick: () => void;
}

export function SidebarBetaPromo({
  billingEnabled,
  onClick,
}: SidebarBetaPromoProps): ReactElement {
  const { t } = useTranslation();

  return (
    <button
      className="group mb-4 w-full rounded-xl border border-syntax-accent/20 bg-gradient-to-br from-syntax-accent/[0.07] to-transparent p-3.5 text-left transition hover:border-syntax-accent/35 hover:from-syntax-accent/10"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-syntax-accent/20 bg-syntax-accent/10 text-syntax-accent transition group-hover:border-syntax-accent/35">
          <SparklesIcon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium leading-snug text-syntax-text">
            {t('betaFeedbackTitle')}
          </span>
          {billingEnabled ? (
            <span className="mt-1 block text-[11px] leading-relaxed text-syntax-muted">
              {t('betaFeedbackHint')}{' '}
              <span className="text-syntax-accent">{t('betaFeedbackReward')}</span>{' '}
              {t('betaFeedbackHintSuffix')}
            </span>
          ) : (
            <span className="mt-1 block text-[11px] leading-relaxed text-syntax-muted">
              {t('betaFeedbackHintSoft')}
            </span>
          )}
        </span>
      </div>
    </button>
  );
}
