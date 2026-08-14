import type { ReactElement } from 'react';
import type { SidePanelMode } from '../types/capture.types';
import { Logo } from '../../components/Logo';
import { useTranslation } from '../../hooks/useTranslation';
import { HomeIcon, SettingsIcon } from './icons';
import { openDashboard } from '../../utils/dashboardNavigation';

interface SidePanelHeaderProps {
  mode: SidePanelMode;
  onOpenSettings: () => void;
}

const HEADER_ICON_BUTTON_CLASS =
  'text-syntax-muted transition hover:text-syntax-accent';

function getSubtitle(
  mode: SidePanelMode,
  t: (key: 'sidePanelQuickNote' | 'sidePanelQuickSearch') => string,
): string {
  return mode === 'search' ? t('sidePanelQuickSearch') : t('sidePanelQuickNote');
}

export function SidePanelHeader({ mode, onOpenSettings }: SidePanelHeaderProps): ReactElement {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-syntax-border px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Logo className="h-8 w-8 shrink-0" />

        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-syntax-text">
            SyntaxAI
          </h1>
          <p className="text-[11px] font-medium lowercase tracking-wide text-syntax-muted">
            {getSubtitle(mode, t)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          aria-label="Open settings"
          className={HEADER_ICON_BUTTON_CLASS}
          onClick={onOpenSettings}
          type="button"
        >
          <SettingsIcon />
        </button>

        <button
          aria-label="Open dashboard"
          className={HEADER_ICON_BUTTON_CLASS}
          onClick={openDashboard}
          type="button"
        >
          <HomeIcon />
        </button>
      </div>
    </header>
  );
}
