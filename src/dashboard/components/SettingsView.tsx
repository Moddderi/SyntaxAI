import type { ReactElement } from 'react';
import { SettingsPanel } from '../../components/SettingsPanel';
import { useTranslation } from '../../hooks/useTranslation';

interface SettingsViewProps {
  onOpenUsage?: () => void;
}

export function SettingsView({ onOpenUsage }: SettingsViewProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-syntax-text">
          {t('settingsTitle')}
        </h1>
        <p className="mt-1 text-sm text-syntax-muted">{t('settingsSubtitle')}</p>
      </header>

      <SettingsPanel onOpenUsage={onOpenUsage} />
    </div>
  );
}
