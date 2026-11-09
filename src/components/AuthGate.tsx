import type { ReactElement } from 'react';
import { Logo } from './Logo';
import { SyntaxWordmark } from './SyntaxWordmark';
import { useTranslation } from '../hooks/useTranslation';
import { openAuthPage } from '../utils/openAuthPage';

interface AuthGateProps {
  /** Narrow side panel layout. Default: full-page dashboard gate. */
  compact?: boolean;
}

export function AuthGate({ compact = false }: AuthGateProps): ReactElement {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 py-10 text-center">
        <Logo className="h-12 w-12" />
        <div className="max-w-[220px] space-y-2">
          <SyntaxWordmark className="justify-center" size="sm" />
          <p className="syntax-title mt-2 text-syntax-text">{t('authGateTitle')}</p>
          <p className="text-[12px] leading-relaxed text-syntax-muted">
            {t('authGateDescription')}
          </p>
        </div>
        <button
          className="syntax-btn-primary syntax-focus-ring px-6 py-2.5 text-[11px]"
          onClick={openAuthPage}
          type="button"
        >
          {t('authGateSignIn')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen w-full flex-1 items-center justify-center bg-syntax-bg px-6 py-12">
      <div className="syntax-view-enter w-full max-w-[380px] rounded-3xl border border-syntax-border bg-syntax-card px-8 py-11 text-center shadow-[var(--syntax-glow)]">
        <div className="mx-auto flex flex-col items-center gap-5">
          <Logo className="h-16 w-16" />
          <div className="space-y-2.5">
            <SyntaxWordmark className="justify-center" size="md" />
            <p className="syntax-title text-syntax-text">{t('authGateTitle')}</p>
            <p className="mx-auto max-w-[280px] text-[13px] leading-relaxed text-syntax-muted">
              {t('authGateDescription')}
            </p>
          </div>
          <button
            className="syntax-btn-primary syntax-focus-ring mt-1 px-8 py-3 text-[11px]"
            onClick={openAuthPage}
            type="button"
          >
            {t('authGateSignIn')}
          </button>
        </div>
      </div>
    </div>
  );
}
