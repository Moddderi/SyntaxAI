import type { ReactElement } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { formatRelativeTime } from '../../utils/noteHelpers';
import { resolveDeviconSlug } from '../../utils/techIcon';
import { openDashboardAllNotes } from '../../utils/dashboardNavigation';
import { useTranslation } from '../../hooks/useTranslation';
import { ClockIcon } from './icons';
import { TechIcon } from '../../components/TechIcon';

const LAST_CAPTURES_LIMIT = 2;

export function RecentNotesSection({
  onOpenNoteDetail,
}: {
  onOpenNoteDetail: (noteId: string) => void;
}): ReactElement {
  const { notes } = useNotes();
  const { t } = useTranslation();
  const recentNotes = notes.slice(0, LAST_CAPTURES_LIMIT);

  return (
    <section aria-label="Recent notes">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5 text-syntax-muted" />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-muted">
            {t('sidePanelRecent')}
          </h2>
        </div>

        <button
          className="text-[11px] font-medium text-syntax-accent transition hover:text-syntax-accent/80"
          onClick={() => {
            void openDashboardAllNotes();
          }}
          type="button"
        >
          {t('sidePanelOpenAll')}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {recentNotes.length > 0 ? (
          recentNotes.map((note) => (
            <article
              key={note.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-syntax-border bg-syntax-card px-3 py-2.5 transition hover:border-syntax-accent/30"
              onClick={() => onOpenNoteDetail(note.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenNoteDetail(note.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TechIcon size="md" tech={resolveDeviconSlug(note.primaryTech)} />

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-syntax-text">{note.title}</h3>
                <p className="mt-0.5 text-[11px] text-syntax-muted">
                  {formatRelativeTime(note.createdAt)}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card px-3 py-4 text-center text-[11px] text-syntax-muted">
            {t('sidePanelNoNotesYet')}
          </div>
        )}
      </div>
    </section>
  );
}
