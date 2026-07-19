import type { ReactElement } from 'react';
import type { SidePanelTab } from '../types/capture.types';

interface FunctionTabsProps {
  activeTab: SidePanelTab;
  onTabChange: (tab: SidePanelTab) => void;
}

interface TabConfig {
  id: SidePanelTab;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'active-capture', label: 'Active Capture' },
  { id: 'recent-logs', label: 'Recent Logs' },
];

export function FunctionTabs({
  activeTab,
  onTabChange,
}: FunctionTabsProps): ReactElement {
  return (
    <nav
      aria-label="Capture sections"
      className="grid grid-cols-2 gap-1 rounded-xl border border-syntax-border bg-syntax-card p-1"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            aria-selected={isActive}
            className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
              isActive
                ? 'bg-syntax-accent/10 text-syntax-accent shadow-[inset_0_0_0_1px_rgba(0,234,255,0.25)]'
                : 'text-gray-400 hover:bg-syntax-bg hover:text-white'
            }`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
