import type { ReactElement } from 'react';
import { openDashboard } from '../utils/dashboardNavigation';
import { ClockIcon } from './icons';
import { TechIcon } from '../../components/TechIcon';

interface RecentNoteItem {
  id: string;
  tech: string;
  title: string;
  capturedAt: string;
}

const LAST_CAPTURES_LIMIT = 2;

const RECENT_NOTES: RecentNoteItem[] = [
  {
    id: 'recent-1',
    tech: 'typescript',
    title: 'useDebouncedValue',
    capturedAt: '12m ago',
  },
  {
    id: 'recent-2',
    tech: 'python',
    title: 'pandas groupby + agg',
    capturedAt: '2h ago',
  },
];

export function RecentNotesSection(): ReactElement {
  return (
    <section aria-label="Last captures">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Last Captures
          </h2>
        </div>

        <button
          className="text-[11px] font-medium text-syntax-accent transition hover:text-syntax-accent/80"
          onClick={openDashboard}
          type="button"
        >
          Open all →
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {RECENT_NOTES.slice(0, LAST_CAPTURES_LIMIT).map((note) => (
          <article
            key={note.id}
            className="flex items-center gap-3 rounded-2xl border border-syntax-border bg-syntax-card px-3 py-2.5 transition hover:border-syntax-accent/30"
          >
            <TechIcon size="md" tech={note.tech} />

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-white">{note.title}</h3>
              <p className="mt-0.5 text-[11px] text-gray-400">{note.capturedAt}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
