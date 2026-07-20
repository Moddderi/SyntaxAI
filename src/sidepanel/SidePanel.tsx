import { useState } from 'react';
import type { ReactElement } from 'react';
import { CaptureView } from './components/CaptureView';
import { GlobalModeTabs } from './components/GlobalModeTabs';
import { SearchView } from './components/SearchView';
import { SidePanelHeader } from './components/SidePanelHeader';
import type { SidePanelMode } from './types/capture.types';

export function SidePanel(): ReactElement {
  const [activeMode, setActiveMode] = useState<SidePanelMode>('capture');

  return (
    <main className="flex min-h-screen flex-col bg-syntax-bg">
      <SidePanelHeader mode={activeMode} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <GlobalModeTabs activeMode={activeMode} onModeChange={setActiveMode} />

        {activeMode === 'capture' ? <CaptureView /> : <SearchView />}
      </div>
    </main>
  );
}
