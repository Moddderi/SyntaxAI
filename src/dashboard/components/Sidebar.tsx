import { useMemo, type ReactElement } from 'react';
import { Logo } from '../../components/Logo';
import { TechIcon } from '../../components/TechIcon';
import type { Note } from '../../types/note';
import {
  computeLanguageNavItems,
  computeLibraryNavCounts,
} from '../../utils/noteHelpers';
import type { LibraryNavItem, LibraryTabId } from '../types/dashboard.types';
import {
  ChartBarIcon,
  ClockIcon,
  NotesIcon,
  SettingsIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
} from './icons';

interface SidebarProps {
  notes: Note[];
  isLoading: boolean;
  activeTab: LibraryTabId;
  onTabChange: (tab: LibraryTabId) => void;
}

function LibraryNavIcon({
  id,
  isActive,
}: {
  id: string;
  isActive?: boolean;
}): ReactElement {
  const className = `h-4 w-4 shrink-0 ${isActive ? 'text-[#00eaff]' : ''}`;

  switch (id) {
    case 'starred':
      return <StarIcon className={className} />;
    case 'recent':
      return <ClockIcon className={className} />;
    case 'analytics':
      return <ChartBarIcon className={className} />;
    case 'tags':
      return <TagIcon className={className} />;
    case 'trash':
      return <TrashIcon className={className} />;
    default:
      return <NotesIcon className={className} />;
  }
}

export function Sidebar({
  notes,
  isLoading,
  activeTab,
  onTabChange,
}: SidebarProps): ReactElement {
  const libraryCounts = useMemo(() => computeLibraryNavCounts(notes), [notes]);
  const languageNavItems = useMemo(
    () => computeLanguageNavItems(notes),
    [notes],
  );

  const libraryNavItems = useMemo<LibraryNavItem[]>(
    () => [
      {
        id: 'all',
        label: 'All notes',
        count: libraryCounts.all,
        isActive: activeTab === 'all',
      },
      {
        id: 'starred',
        label: 'Starred',
        count: libraryCounts.starred,
        isActive: activeTab === 'starred',
      },
      {
        id: 'recent',
        label: 'Recent',
        count: libraryCounts.recent,
        isActive: activeTab === 'recent',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        isActive: activeTab === 'analytics',
      },
      {
        id: 'tags',
        label: 'Tags',
        count: libraryCounts.tags,
        isActive: activeTab === 'tags',
      },
      {
        id: 'trash',
        label: 'Trash',
        count: 0,
        isActive: activeTab === 'trash',
      },
    ],
    [activeTab, libraryCounts],
  );

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[#1c1c20] bg-[#0d0d0f] px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2">
        <Logo className="h-9 w-9" />
        <div>
          <h1 className="text-sm font-semibold text-white">SyntaxAI</h1>
          <p className="text-[11px] text-gray-400">Developer notebook</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Library
        </h2>
        <nav className="flex flex-col gap-1">
          {libraryNavItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                item.isActive
                  ? 'bg-[#141417] text-white'
                  : 'text-gray-400 hover:bg-[#141417]/60 hover:text-white'
              }`}
              onClick={() => onTabChange(item.id as LibraryTabId)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <LibraryNavIcon id={item.id} isActive={item.isActive} />
                <span className="truncate">{item.label}</span>
              </span>
              {item.count !== undefined ? (
                <span className="text-xs text-gray-500">
                  {isLoading ? '—' : item.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </section>

      <section className="mb-6 flex-1">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Languages
          </h2>
          <button
            className="text-sm text-gray-400 transition hover:text-[#00eaff]"
            type="button"
          >
            +
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {languageNavItems.length > 0 ? (
            languageNavItems.map((item) => (
              <button
                key={item.id}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-400 transition hover:bg-[#141417]/60 hover:text-white"
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <TechIcon size="sm" tech={item.tech} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-xs text-gray-500">
                  {isLoading ? '—' : item.count}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-gray-500">
              Languages appear as you add notes.
            </p>
          )}
        </nav>
      </section>

      <section className="border-t border-[#1c1c20] pt-4">
        <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Account
        </h2>
        <button
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 transition hover:bg-[#141417]/60 hover:text-white"
          type="button"
        >
          <SettingsIcon />
          Settings
        </button>
      </section>
    </aside>
  );
}
