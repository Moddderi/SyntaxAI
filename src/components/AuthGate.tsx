import type { ReactElement } from 'react';
import { Logo } from './Logo';
import { SyntaxWordmark } from './SyntaxWordmark';
import { useTranslation } from '../hooks/useTranslation';
import { openAuthPage } from '../utils/openAuthPage';

interface AuthGateProps {
  compact?: boolean;
}

export function AuthGate({ compact = false }: AuthGateProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'gap-4 px-4 py-10' : 'min-h-[60vh] gap-6 px-6 py-16'
      }`}
    >
      <Logo className="h-14 w-14" />
      <div className="max-w-md space-y-2">
        <SyntaxWordmark className="justify-center" size={compact ? 'sm' : 'md'} />
        <p className="syntax-title mt-3 text-syntax-text">{t('authGateTitle')}</p>
        <p className="text-[13px] leading-relaxed text-syntax-muted">{t('authGateDescription')}</p>
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
