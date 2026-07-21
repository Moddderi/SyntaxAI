import { useMemo, useState, type ReactElement } from 'react';
import { useNotes } from '../hooks/useNotes';
import {
  filterNotesByLibraryTab,
  getLibraryTabTitle,
} from '../utils/analyticsHelpers';
import type { LibraryTabId } from './types/dashboard.types';
import { AnalyticsView } from './components/AnalyticsView';
import { DashboardTopBar } from './components/DashboardTopBar';
import { FloatingBar } from './components/FloatingBar';
import { Sidebar } from './components/Sidebar';
import { SnippetGrid } from './components/SnippetGrid';
import { StatsGrid } from './components/StatsGrid';

export function Dashboard(): ReactElement {
  const { notes, isLoading } = useNotes();
  const [activeTab, setActiveTab] = useState<LibraryTabId>('all');

  const filteredNotes = useMemo(() => {
    if (activeTab === 'analytics') {
      return notes;
    }

    return filterNotesByLibraryTab(notes, activeTab);
  }, [activeTab, notes]);

  const isAnalyticsView = activeTab === 'analytics';

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0f] text-white">
      <Sidebar
        activeTab={activeTab}
        isLoading={isLoading}
        notes={notes}
        onTabChange={setActiveTab}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-28">
          <DashboardTopBar />

          {isAnalyticsView ? (
            <AnalyticsView isLoading={isLoading} notes={notes} />
          ) : (
            <>
              <StatsGrid isLoading={isLoading} notes={notes} />
              <SnippetGrid
                emptyMessage={
                  activeTab === 'tags'
                    ? 'Tag filtering is coming soon.'
                    : activeTab === 'trash'
                      ? 'Trash is empty.'
                      : undefined
                }
                isLoading={isLoading}
                notes={filteredNotes}
                title={getLibraryTabTitle(activeTab)}
              />
            </>
          )}
        </main>
      </div>

      <FloatingBar />
    </div>
  );
}
