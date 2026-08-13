import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { NoteDetailModal } from '../components/NoteDetailModal';
import { SettingsModal } from '../components/SettingsModal';
import { useTheme } from '../hooks/useTheme';
import { CONTEXT_CAPTURE_STORAGE_KEY } from '../types/context';
import { CaptureView } from './components/CaptureView';
import { GlobalModeTabs } from './components/GlobalModeTabs';
import { SearchView } from './components/SearchView';
import { SidePanelHeader } from './components/SidePanelHeader';
import type { SidePanelMode } from './types/capture.types';
import type { Note } from '../types/note';
import { useNotes } from '../hooks/useNotes';

export function SidePanel(): ReactElement {
  useTheme();
  const [activeMode, setActiveMode] = useState<SidePanelMode>('capture');
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { notes } = useNotes();

  const detailNote = useMemo(() => {
    if (!selectedNoteForDetail) {
      return null;
    }

    return notes.find((note) => note.id === selectedNoteForDetail.id) ?? selectedNoteForDetail;
  }, [notes, selectedNoteForDetail]);

  const handleOpenNoteDetail = useCallback(
    (noteId: string): void => {
      const note = notes.find((item) => item.id === noteId);

      if (note) {
        setSelectedNoteForDetail(note);
      }
    },
    [notes],
  );

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
      return;
    }

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName === 'local' && changes[CONTEXT_CAPTURE_STORAGE_KEY]?.newValue) {
        setActiveMode('capture');
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-syntax-bg">
      <SidePanelHeader mode={activeMode} onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <GlobalModeTabs activeMode={activeMode} onModeChange={setActiveMode} />

        {activeMode === 'capture' ? (
          <CaptureView
            onContextCaptureStart={() => setActiveMode('capture')}
            onOpenNoteDetail={handleOpenNoteDetail}
          />
        ) : (
          <SearchView onOpenDetail={handleOpenNoteDetail} />
        )}
      </div>

      <NoteDetailModal
        note={detailNote}
        onClose={() => setSelectedNoteForDetail(null)}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </main>
  );
}
