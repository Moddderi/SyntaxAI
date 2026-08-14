import type { ReactElement } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import type { SidePanelMode } from '../types/capture.types';
import { LightningIcon, SearchIcon } from './icons';

interface GlobalModeTabsProps {
  activeMode: SidePanelMode;
  onModeChange: (mode: SidePanelMode) => void;
}

export function GlobalModeTabs({
  activeMode,
  onModeChange,
}: GlobalModeTabsProps): ReactElement {
  const { t } = useTranslation();

  const modeTabs: { id: SidePanelMode; label: string; icon: ReactElement }[] = [
    { id: 'capture', label: t('sidePanelNewNote'), icon: <LightningIcon /> },
    { id: 'search', label: t('sidePanelSearch'), icon: <SearchIcon /> },
  ];

  return (
    <nav
      aria-label="Side panel mode"
      className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-syntax-border bg-syntax-card p-1"
    >
      {modeTabs.map((tab) => {
        const isActive = activeMode === tab.id;

        return (
          <button
            key={tab.id}
            aria-selected={isActive}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
              isActive
                ? 'bg-syntax-accent text-black'
                : 'text-syntax-muted hover:bg-syntax-bg hover:text-syntax-text'
            }`}
            onClick={() => onModeChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
