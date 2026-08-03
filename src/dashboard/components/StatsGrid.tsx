import type { ReactElement } from 'react';
import type { Note } from '../../types/note';
import { TechIcon } from '../../components/TechIcon';
import { computeStatCards } from '../../utils/noteHelpers';

interface StatsGridProps {
  notes: Note[];
  isLoading: boolean;
}

export function StatsGrid({ notes, isLoading }: StatsGridProps): ReactElement {
  const statCards = computeStatCards(notes);

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const progressPercent =
          stat.progress && stat.progress.total > 0
            ? Math.round((stat.progress.current / stat.progress.total) * 100)
            : 0;

        return (
          <article
            key={stat.id}
            className="rounded-2xl border border-[#1c1c20] bg-[#141417] p-5"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {isLoading ? '—' : stat.value}
            </p>
            <p className="mt-1 text-xs text-[#00eaff]/80">{stat.hint}</p>

            {stat.id === 'ai-credits' && stat.progress ? (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-gray-500">
                  <span>
                    {isLoading
                      ? '—'
                      : `${stat.progress.current} / ${stat.progress.total}`}
                  </span>
                  <span>{isLoading ? '—' : `${progressPercent}%`}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#0d0d0f]">
                  <div
                    className="h-full rounded-full bg-[#00eaff] transition-all"
                    style={{ width: isLoading ? '0%' : `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}

            {stat.id === 'technologies' && stat.topTechnologies && stat.topTechnologies.length > 0 ? (
              <div className="mt-4 flex items-center gap-1.5">
                {stat.topTechnologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-[#1c1c20] bg-[#0d0d0f] p-1"
                    title={tech}
                  >
                    <TechIcon size="sm" tech={tech} />
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
