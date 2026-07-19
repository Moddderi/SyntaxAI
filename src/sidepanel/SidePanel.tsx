import { useState } from 'react';
import type { ReactElement } from 'react';
import { ActiveCaptureTab } from './components/ActiveCaptureTab';
import { FunctionTabs } from './components/FunctionTabs';
import { RecentLogsTab } from './components/RecentLogsTab';
import { SidePanelHeader } from './components/SidePanelHeader';
import type { SidePanelTab } from './types/capture.types';

export function SidePanel(): ReactElement {
  const [activeTab, setActiveTab] = useState<SidePanelTab>('active-capture');

  return (
    <main className="flex min-h-screen flex-col bg-syntax-bg">
      <SidePanelHeader />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <FunctionTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'active-capture' ? (
          <ActiveCaptureTab />
        ) : (
          <RecentLogsTab />
        )}
      </div>
    </main>
  );
}
