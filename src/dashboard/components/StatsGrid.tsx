import type { ReactElement } from 'react';
import type { Note } from '../../types/note';
import { computeStatCards } from '../../utils/noteHelpers';

interface StatsGridProps {
  notes: Note[];
  isLoading: boolean;
}

export function StatsGrid({ notes, isLoading }: StatsGridProps): ReactElement {
  const statCards = computeStatCards(notes);

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => (
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
        </article>
      ))}
    </section>
  );
}
