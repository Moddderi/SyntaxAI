import type { ReactElement } from 'react';
import type { SidePanelMode } from '../types/capture.types';
import { LightningIcon, SearchIcon } from './icons';

interface GlobalModeTabsProps {
  activeMode: SidePanelMode;
  onModeChange: (mode: SidePanelMode) => void;
}

interface ModeTabConfig {
  id: SidePanelMode;
  label: string;
  icon: ReactElement;
}

const MODE_TABS: ModeTabConfig[] = [
  {
    id: 'capture',
    label: 'New Note',
    icon: <LightningIcon />,
  },
  {
    id: 'search',
    label: 'Search',
    icon: <SearchIcon />,
  },
];

export function GlobalModeTabs({
  activeMode,
  onModeChange,
}: GlobalModeTabsProps): ReactElement {
  return (
    <nav
      aria-label="Side panel mode"
      className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-syntax-border bg-syntax-card p-1"
    >
      {MODE_TABS.map((tab) => {
        const isActive = activeMode === tab.id;

        return (
          <button
            key={tab.id}
            aria-selected={isActive}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
              isActive
                ? 'bg-syntax-accent text-black'
                : 'text-gray-400 hover:bg-syntax-bg hover:text-white'
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
