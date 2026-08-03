import type { ReactElement } from 'react';
import { TechIcon } from '../../components/TechIcon';
import { getTechBrandColor } from '../../utils/techIcon';

interface TechHeroBannerProps {
  techSlug: string;
  techName: string;
  snippetsCount: number;
}

export function TechHeroBanner({
  techSlug,
  techName,
  snippetsCount,
}: TechHeroBannerProps): ReactElement {
  const accentColor = getTechBrandColor(techSlug);
  const snippetLabel = `${snippetsCount} snippet${snippetsCount === 1 ? '' : 's'}`;

  return (
    <section
      className="animate-fade-in mb-8 overflow-hidden rounded-2xl border border-white/5 bg-[#121316] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent p-6 transition-all"
      style={{
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.04), 0 0 40px -12px ${accentColor}33`,
      }}
    >
      <div className="flex flex-wrap items-start gap-5">
        <div
          className="rounded-2xl border border-white/5 bg-[#0d0d0f]/80 p-3 shadow-lg"
          style={{ boxShadow: `0 0 24px -8px ${accentColor}55` }}
        >
          <TechIcon className="h-14 w-14" tech={techSlug} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1
              className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_18px_rgba(0,234,255,0.25)]"
              style={{ textShadow: `0 0 28px ${accentColor}44` }}
            >
              {techName}
            </h1>

            <span className="rounded-full border border-[#00eaff]/25 bg-[#00eaff]/10 px-3 py-1 text-xs font-semibold text-[#00eaff]">
              {snippetLabel}
            </span>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
            Collection of snippets, patterns and notes for{' '}
            <span className="font-medium text-gray-300">{techName}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
