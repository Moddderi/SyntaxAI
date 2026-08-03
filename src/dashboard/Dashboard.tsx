import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { SettingsModal } from '../components/SettingsModal';
import { NoteDetailModal } from '../components/NoteDetailModal';
import { useNotes } from '../hooks/useNotes';
import {
  consumeOpenSettingsIntent,
  OPEN_SETTINGS_STORAGE_KEY,
} from '../utils/dashboardNavigation';
import {
  filterNotesByLibraryTab,
  getLibraryTabTitle,
} from '../utils/analyticsHelpers';
import type { LibraryTabId } from './types/dashboard.types';
import type { Note } from '../types/note';
import { AnalyticsView } from './components/AnalyticsView';
import { DashboardTopBar } from './components/DashboardTopBar';
import { QuickSearchModal } from './components/QuickSearchModal';
import { Sidebar } from './components/Sidebar';
import { SnippetGrid } from './components/SnippetGrid';
import { StatsGrid } from './components/StatsGrid';
import { TechHeroBanner } from './components/TechHeroBanner';
import { TrashGrid } from './components/TrashGrid';
import { filterNotesByTechnology } from '../utils/noteHelpers';
import { formatTechnologyLabel } from '../utils/techIcon';

export function Dashboard(): ReactElement {
  const { notes, trashNotes, isLoading } = useNotes();
  const [activeTab, setActiveTab] = useState<LibraryTabId>('all');
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null);

  const detailNote = useMemo(() => {
    if (!selectedNoteForDetail) {
      return null;
    }

    return notes.find((note) => note.id === selectedNoteForDetail.id) ?? selectedNoteForDetail;
  }, [notes, selectedNoteForDetail]);

  const filteredNotes = useMemo(() => {
    if (activeTab === 'analytics' || activeTab === 'trash') {
      return notes;
    }

    const tabNotes = filterNotesByLibraryTab(notes, activeTab);
    return filterNotesByTechnology(tabNotes, selectedTechnology);
  }, [activeTab, notes, selectedTechnology]);

  const gridTitle = useMemo(() => {
    if (selectedTechnology) {
      return formatTechnologyLabel(selectedTechnology);
    }

    return getLibraryTabTitle(activeTab);
  }, [activeTab, selectedTechnology]);

  const handleTabChange = useCallback((tab: LibraryTabId): void => {
    setSelectedTechnology(null);
    setActiveTab(tab);
  }, []);

  const handleTechnologySelect = useCallback((techSlug: string): void => {
    setSelectedTechnology(techSlug);
    setActiveTab('all');
  }, []);

  const handleOpenNoteDetail = useCallback(
    (noteId: string): void => {
      const note = notes.find((item) => item.id === noteId);

      if (note) {
        setSelectedNoteForDetail(note);
      }
    },
    [notes],
  );

  const handleSelectNoteFromSearch = useCallback(
    (noteId: string): void => {
      setSelectedTechnology(null);
      setActiveTab('all');
      setIsQuickSearchOpen(false);

      const note = notes.find((item) => item.id === noteId);

      if (note) {
        setSelectedNoteForDetail(note);
      }
    },
    [notes],
  );

  useEffect(() => {
    const openSettingsIfRequested = async (): Promise<void> => {
      const shouldOpen = await consumeOpenSettingsIntent();

      if (shouldOpen) {
        setIsSettingsOpen(true);
      }
    };

    void openSettingsIfRequested();

    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
      return;
    }

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName === 'local' && changes[OPEN_SETTINGS_STORAGE_KEY]?.newValue === true) {
        setIsSettingsOpen(true);
        void chrome.storage.local.remove(OPEN_SETTINGS_STORAGE_KEY);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isModifierPressed = event.metaKey || event.ctrlKey;

      if (isModifierPressed && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsQuickSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAnalyticsView = activeTab === 'analytics';
  const isTrashView = activeTab === 'trash';
  const isTechnologyView = selectedTechnology !== null;
  const showStatsGrid =
    !isTechnologyView &&
    (activeTab === 'all' || activeTab === 'recent' || activeTab === 'starred');

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0f] text-white">
      <Sidebar
        activeTab={activeTab}
        isLoading={isLoading}
        notes={notes}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onTabChange={handleTabChange}
        onTechnologySelect={handleTechnologySelect}
        selectedTechnology={selectedTechnology}
        trashCount={trashNotes.length}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <DashboardTopBar onOpenQuickSearch={() => setIsQuickSearchOpen(true)} />

          {isAnalyticsView ? (
            <AnalyticsView isLoading={isLoading} notes={notes} />
          ) : isTrashView ? (
            <TrashGrid isLoading={isLoading} notes={trashNotes} />
          ) : (
            <>
              {isTechnologyView && selectedTechnology ? (
                <TechHeroBanner
                  key={selectedTechnology}
                  snippetsCount={filteredNotes.length}
                  techName={formatTechnologyLabel(selectedTechnology)}
                  techSlug={selectedTechnology}
                />
              ) : null}

              {showStatsGrid ? (
                <StatsGrid isLoading={isLoading} notes={notes} />
              ) : null}

              <SnippetGrid
                emptyMessage={
                  selectedTechnology
                    ? `No notes for ${formatTechnologyLabel(selectedTechnology)} yet.`
                    : undefined
                }
                isLoading={isLoading}
                notes={filteredNotes}
                onOpenDetail={handleOpenNoteDetail}
                title={isTechnologyView ? 'Snippets' : gridTitle}
              />
            </>
          )}
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        notes={notes}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectNote={handleSelectNoteFromSearch}
      />

      <NoteDetailModal
        note={detailNote}
        onClose={() => setSelectedNoteForDetail(null)}
      />
    </div>
  );
}


