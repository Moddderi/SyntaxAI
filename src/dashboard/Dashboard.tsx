import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { SettingsView } from './components/SettingsView';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { NoteDetailModal } from '../components/NoteDetailModal';
import { deleteNote, toggleStar } from '../storage/notesStorage';
import { useNotes } from '../hooks/useNotes';
import { useTranslation } from '../hooks/useTranslation';
import {
  consumeOpenLibraryTabIntent,
  consumeOpenSettingsIntent,
  OPEN_LIBRARY_TAB_STORAGE_KEY,
  OPEN_SETTINGS_STORAGE_KEY,
} from '../utils/dashboardNavigation';
import {
  filterNotesByLibraryTab,
  getLibraryTabTitleKey,
} from '../utils/analyticsHelpers';
import type { LibraryTabId } from './types/dashboard.types';
import type { Note } from '../types/note';
import { AnalyticsView } from './components/AnalyticsView';
import { BugReportView } from './components/BugReportView';
import { FeedbackView } from './components/FeedbackView';
import { DashboardTopBar } from './components/DashboardTopBar';
import { QuickSearchModal } from './components/QuickSearchModal';
import { Sidebar } from './components/Sidebar';
import { SnippetGrid } from './components/SnippetGrid';
import { StackView } from './components/StackView';
import { TechHeroBanner } from './components/TechHeroBanner';
import { TrashGrid } from './components/TrashGrid';
import { filterNotesByTechnology } from '../utils/noteHelpers';
import { formatTechnologyLabel } from '../utils/techIcon';
import { AuthGate } from '../components/AuthGate';
import { useAuthSession } from '../hooks/useAuthSession';
import { openAuthPage } from '../utils/openAuthPage';

export function Dashboard(): ReactElement {
  const { t } = useTranslation();
  const { status: authStatus, user, billingEnabled, refresh: refreshAuth } = useAuthSession();
  const { notes, trashNotes, isLoading } = useNotes();
  const [activeTab, setActiveTab] = useState<LibraryTabId>('all');
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

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

    if (activeTab === 'stack' && !selectedTechnology) {
      return notes;
    }

    const tabNotes =
      activeTab === 'stack'
        ? notes
        : filterNotesByLibraryTab(notes, activeTab);

    return filterNotesByTechnology(tabNotes, selectedTechnology);
  }, [activeTab, notes, selectedTechnology]);

  const gridTitle = useMemo(() => {
    if (selectedTechnology) {
      return formatTechnologyLabel(selectedTechnology);
    }

    return t(getLibraryTabTitleKey(activeTab));
  }, [activeTab, selectedTechnology, t]);

  const handleTabChange = useCallback((tab: LibraryTabId): void => {
    setSelectedTechnology(null);
    setActiveTab(tab);
    setIsSettingsOpen(false);
    setIsFeedbackOpen(false);
    setIsBugReportOpen(false);
  }, []);

  const openFeedbackView = useCallback((): void => {
    setIsSettingsOpen(false);
    setIsBugReportOpen(false);
    setIsFeedbackOpen(true);
  }, []);

  const openBugReportView = useCallback((): void => {
    setIsSettingsOpen(false);
    setIsFeedbackOpen(false);
    setIsBugReportOpen(true);
  }, []);

  const handleTechnologySelect = useCallback((techSlug: string): void => {
    setSelectedTechnology(techSlug);
    setActiveTab('stack');
  }, []);

  const handleBackToStack = useCallback((): void => {
    setSelectedTechnology(null);
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
    const openDeepLinkIfRequested = async (): Promise<void> => {
      const libraryTab = await consumeOpenLibraryTabIntent();

      if (libraryTab) {
        setIsSettingsOpen(false);
        setIsFeedbackOpen(false);
        setIsBugReportOpen(false);
        setSelectedTechnology(null);
        setActiveTab(libraryTab);
      }

      const shouldOpenSettings = await consumeOpenSettingsIntent();

      if (shouldOpenSettings) {
        setIsBugReportOpen(false);
        setIsFeedbackOpen(false);
        setIsSettingsOpen(true);
      }
    };

    void openDeepLinkIfRequested();

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

      const libraryTab = changes[OPEN_LIBRARY_TAB_STORAGE_KEY]?.newValue;

      if (
        areaName === 'local' &&
        (libraryTab === 'all' ||
          libraryTab === 'starred' ||
          libraryTab === 'stack' ||
          libraryTab === 'analytics' ||
          libraryTab === 'trash')
      ) {
        setIsSettingsOpen(false);
        setIsFeedbackOpen(false);
        setIsBugReportOpen(false);
        setSelectedTechnology(null);
        setActiveTab(libraryTab);
        void chrome.storage.local.remove(OPEN_LIBRARY_TAB_STORAGE_KEY);
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

  const isFeedbackView = isFeedbackOpen;
  const isBugReportView = isBugReportOpen && !isFeedbackView;
  const isSettingsView = isSettingsOpen && !isFeedbackView && !isBugReportView;
  const isAnalyticsView =
    activeTab === 'analytics' && !isSettingsView && !isFeedbackView && !isBugReportView;
  const isTrashView =
    activeTab === 'trash' && !isSettingsView && !isFeedbackView && !isBugReportView;
  const isStackBrowseView =
    activeTab === 'stack' &&
    selectedTechnology === null &&
    !isSettingsView &&
    !isFeedbackView &&
    !isBugReportView;
  const isTechnologyDetailView =
    selectedTechnology !== null && !isSettingsView && !isFeedbackView && !isBugReportView;
  const viewKey = isFeedbackView
    ? 'feedback'
    : isBugReportView
      ? 'bug'
      : isSettingsView
        ? 'settings'
        : isAnalyticsView
          ? 'analytics'
          : isTrashView
            ? 'trash'
            : isStackBrowseView
              ? 'stack'
              : isTechnologyDetailView && selectedTechnology
                ? `tech:${selectedTechnology}`
                : activeTab;

  return (
    <div className="flex h-screen overflow-hidden bg-syntax-bg text-syntax-text">
      {authStatus === 'loading' ? (
        <div className="flex h-full w-full flex-1 items-center justify-center text-sm text-syntax-muted">
          …
        </div>
      ) : authStatus === 'signed_out' ? (
        <AuthGate />
      ) : (
        <>
      <Sidebar
        activeTab={activeTab}
        billingEnabled={billingEnabled}
        isLoading={isLoading}
        notes={notes}
        onOpenSettings={() => {
          setIsFeedbackOpen(false);
          setIsBugReportOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenBetaFeedback={openFeedbackView}
        isSettingsActive={isSettingsView}
        onTabChange={handleTabChange}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <DashboardTopBar
            isBugReportActive={isBugReportView}
            isTrashActive={isTrashView}
            onAuthRefresh={refreshAuth}
            onLoginClick={openAuthPage}
            onOpenBugReport={openBugReportView}
            onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
            onOpenTrash={() => handleTabChange('trash')}
            signedInUser={user}
            trashCount={trashNotes.length}
          />

          <div className="syntax-view-enter" key={viewKey}>
          {isFeedbackView ? (
            <FeedbackView />
          ) : isBugReportView ? (
            <BugReportView />
          ) : isSettingsView ? (
            <SettingsView
              onOpenUsage={() => {
                setIsSettingsOpen(false);
                setIsBugReportOpen(false);
                setIsFeedbackOpen(false);
                setActiveTab('analytics');
              }}
            />
          ) : isAnalyticsView ? (
            <AnalyticsView isLoading={isLoading} notes={notes} />
          ) : isTrashView ? (
            <TrashGrid isLoading={isLoading} notes={trashNotes} />
          ) : isStackBrowseView ? (
            <StackView
              isLoading={isLoading}
              notes={notes}
              onSelectTechnology={handleTechnologySelect}
            />
          ) : (
            <>
              {isTechnologyDetailView && selectedTechnology ? (
                <TechHeroBanner
                  key={selectedTechnology}
                  onBackToStack={handleBackToStack}
                  snippetsCount={filteredNotes.length}
                  techName={formatTechnologyLabel(selectedTechnology)}
                  techSlug={selectedTechnology}
                />
              ) : null}

              <SnippetGrid
                emptyMessage={
                  selectedTechnology
                    ? t('libraryEmptyForTech', {
                        tech: formatTechnologyLabel(selectedTechnology),
                      })
                    : undefined
                }
                isLoading={isLoading}
                notes={filteredNotes}
                onOpenDetail={handleOpenNoteDetail}
                title={isTechnologyDetailView ? t('librarySnippets') : gridTitle}
              />
            </>
          )}
          </div>
        </main>
      </div>

      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        notes={notes}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectNote={handleSelectNoteFromSearch}
      />

      <NoteDetailModal
        note={detailNote}
        onClose={() => setSelectedNoteForDetail(null)}
        onRequestDelete={setDeleteNoteId}
        onToggleStar={(noteId) => {
          void toggleStar(noteId);
        }}
      />

      <ConfirmDeleteModal
        isOpen={deleteNoteId !== null}
        noteTitle={notes.find((item) => item.id === deleteNoteId)?.title ?? t('libraryThisNote')}
        onCancel={() => setDeleteNoteId(null)}
        onConfirm={() => {
          if (!deleteNoteId) {
            return;
          }

          void deleteNote(deleteNoteId);
          setDeleteNoteId(null);
          setSelectedNoteForDetail(null);
        }}
      />
        </>
      )}
    </div>
  );
}
