import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { NoteDetailModal } from '../components/NoteDetailModal';
import { CaptureView } from './components/CaptureView';
import { GlobalModeTabs } from './components/GlobalModeTabs';
import { SearchView } from './components/SearchView';
import { SidePanelHeader } from './components/SidePanelHeader';
import type { SidePanelMode } from './types/capture.types';
import type { Note } from '../types/note';
import { useNotes } from '../hooks/useNotes';

export function SidePanel(): ReactElement {
  const [activeMode, setActiveMode] = useState<SidePanelMode>('capture');
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null);
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

  return (
    <main className="flex min-h-screen flex-col bg-syntax-bg">
      <SidePanelHeader mode={activeMode} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <GlobalModeTabs activeMode={activeMode} onModeChange={setActiveMode} />

        {activeMode === 'capture' ? (
          <CaptureView onOpenNoteDetail={handleOpenNoteDetail} />
        ) : (
          <SearchView onOpenDetail={handleOpenNoteDetail} />
        )}
      </div>

      <NoteDetailModal
        note={detailNote}
        onClose={() => setSelectedNoteForDetail(null)}
      />
    </main>
  );
}
