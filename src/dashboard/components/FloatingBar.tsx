import type { ReactElement } from 'react';
import { CameraIcon, ChatIcon, EditIcon, TextIcon } from './icons';

interface FloatingAction {
  id: string;
  label: string;
  icon: ReactElement;
}

const FLOATING_ACTIONS: FloatingAction[] = [
  { id: 'capture-screen', label: 'Capture screen', icon: <CameraIcon /> },
  { id: 'capture-text', label: 'Capture text', icon: <TextIcon /> },
  { id: 'edit-note', label: 'Edit note', icon: <EditIcon /> },
  { id: 'open-chat', label: 'Open chat', icon: <ChatIcon /> },
];

export function FloatingBar(): ReactElement {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-[#1c1c20] bg-[#141417]/80 p-2 px-4 shadow-xl backdrop-blur">
        {FLOATING_ACTIONS.map((action) => (
          <button
            key={action.id}
            aria-label={action.label}
            className="rounded-full p-2 text-gray-400 transition hover:bg-[#0d0d0f] hover:text-[#00eaff]"
            type="button"
          >
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
