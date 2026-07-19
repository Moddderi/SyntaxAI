import type { ReactElement } from 'react';
import { Logo } from '../../components/Logo';
import { SettingsIcon } from './icons';

function openDashboard(): void {
  void chrome.runtime.openOptionsPage();
}

export function SidePanelHeader(): ReactElement {
  return (
    <header className="flex items-center justify-between border-b border-syntax-border px-4 py-3.5">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8 shrink-0" />

        <div>
          <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-white">
            SyntaxAI
          </h1>
          <p className="text-[11px] font-medium lowercase tracking-wide text-gray-400">
            quick capture
          </p>
        </div>
      </div>

      <button
        aria-label="Open dashboard settings"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-syntax-border bg-syntax-card text-gray-400 transition hover:border-syntax-accent/40 hover:text-syntax-accent"
        onClick={openDashboard}
        type="button"
      >
        <SettingsIcon />
      </button>
    </header>
  );
}
