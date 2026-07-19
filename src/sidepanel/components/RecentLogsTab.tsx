import type { ReactElement } from 'react';
import type { RecentLogItem } from '../types/capture.types';

const MOCK_RECENT_LOGS: RecentLogItem[] = [
  {
    id: 'log-1',
    title: 'Prisma findFirst with include',
    tags: ['#prisma', '#db'],
    capturedAt: '2m ago',
  },
  {
    id: 'log-2',
    title: 'Next.js middleware auth guard',
    tags: ['#nextjs', '#auth'],
    capturedAt: '18m ago',
  },
  {
    id: 'log-3',
    title: 'Tailwind custom syntax tokens',
    tags: ['#css', '#ui'],
    capturedAt: '1h ago',
  },
];

export function RecentLogsTab(): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {MOCK_RECENT_LOGS.map((log) => (
        <article
          key={log.id}
          className="rounded-2xl border border-syntax-border bg-syntax-card p-4 transition hover:border-syntax-accent/30"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-medium text-white">{log.title}</h3>
            <span className="shrink-0 text-[10px] uppercase tracking-wide text-syntax-accent/80">
              {log.capturedAt}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {log.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-syntax-border bg-syntax-bg px-3 py-1 text-[11px] text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
