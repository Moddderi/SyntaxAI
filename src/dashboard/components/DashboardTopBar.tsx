import type { ReactElement } from 'react';
import { SearchIcon } from './icons';

export function DashboardTopBar(): ReactElement {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          aria-label="Search dashboard notes"
          className="h-12 w-full rounded-2xl border border-[#1c1c20] bg-[#141417] py-2 pl-11 pr-16 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-[#00eaff]/40"
          placeholder="Search notes, tags, languages..."
          type="search"
        />
        <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-[#1c1c20] bg-[#0d0d0f] px-1.5 py-0.5 text-[10px] text-gray-400">
          ⌘K
        </kbd>
      </div>

      <button
        className="h-12 shrink-0 rounded-full bg-[#00eaff] px-5 text-sm font-semibold text-black transition hover:bg-[#00eaff]/90"
        type="button"
      >
        + Capture
      </button>
    </div>
  );
}
