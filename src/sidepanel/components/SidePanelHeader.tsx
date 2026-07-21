import type { ReactElement } from 'react';
import type { SidePanelMode } from '../types/capture.types';
import { Logo } from '../../components/Logo';
import { HomeIcon, SettingsIcon } from './icons';
import { openDashboard } from '../utils/dashboardNavigation';

interface SidePanelHeaderProps {
  mode: SidePanelMode;
}

const HEADER_ICON_BUTTON_CLASS =
  'text-gray-400 transition hover:text-syntax-accent';

function getSubtitle(mode: SidePanelMode): string {
  return mode === 'search' ? 'quick search' : 'quick note';
}

export function SidePanelHeader({ mode }: SidePanelHeaderProps): ReactElement {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-syntax-border px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Logo className="h-8 w-8 shrink-0" />

        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-white">
            SyntaxAI
          </h1>
          <p className="text-[11px] font-medium lowercase tracking-wide text-gray-400">
            {getSubtitle(mode)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          aria-label="Open dashboard settings"
          className={HEADER_ICON_BUTTON_CLASS}
          onClick={openDashboard}
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
