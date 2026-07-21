import { useMemo, type ReactElement } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Note } from '../../types/note';
import {
  ANALYTICS_CHART_COLORS,
  computeActivityHeatmap,
  computeEstimatedTimeSavedHours,
  computeInputMethodBreakdown,
  computeLanguageBreakdown,
  formatHeatmapDate,
  getHeatmapCellClass,
} from '../../utils/analyticsHelpers';
import { FlameIcon } from './icons';

interface AnalyticsViewProps {
  notes: Note[];
  isLoading: boolean;
}

interface ChartTooltipPayload {
  name?: string;
  value?: number;
  payload?: {
    count?: number;
    percentage?: number;
  };
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AnalyticsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}): ReactElement | null {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const count = item.payload?.count ?? item.value ?? 0;
  const percentage = item.payload?.percentage;

  return (
    <div className="rounded-xl border border-[#1c1c20] bg-[#141417] px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-white">{item.name}</p>
      <p className="mt-0.5 text-[#00eaff]">
        {count} notes{percentage !== undefined ? ` · ${percentage}%` : ''}
      </p>
    </div>
  );
}

function ActivityHeatmap({ notes }: { notes: Note[] }): ReactElement {
  const heatmap = useMemo(() => computeActivityHeatmap(notes), [notes]);

  return (
    <section className="rounded-2xl border border-[#1c1c20] bg-[#141417] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Capture Activity</h2>
          <p className="mt-1 text-xs text-gray-400">
            GitHub-style matrix of notes saved over the last {heatmap.weeks} weeks
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00eaff]/30 bg-[#00eaff]/10 px-3 py-1 text-xs font-medium text-[#00eaff]">
          Current Streak: {heatmap.currentStreak} day{heatmap.currentStreak === 1 ? '' : 's'}
          <FlameIcon className="h-3.5 w-3.5 text-[#00eaff] drop-shadow-[0_0_6px_#00eaff]" />
        </span>
      </div>

          <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="min-w-max">
          <div className="mb-2 flex gap-1 pl-8">
            {Array.from({ length: heatmap.weeks }, (_, weekIndex) => {
              const firstCell = heatmap.grid[0]?.[weekIndex];
              const showLabel =
                weekIndex === 0 ||
                weekIndex === 4 ||
                weekIndex === 8 ||
                weekIndex === 12 ||
                weekIndex === heatmap.weeks - 1;

              return (
                <span
                  key={`week-label-${weekIndex}`}
                  className="flex h-3 w-3.5 items-start justify-center text-[10px] text-gray-500"
                >
                  {showLabel && firstCell
                    ? firstCell.date.toLocaleDateString('en-US', { month: 'short' })
                    : ''}
                </span>
              );
            })}
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 pt-0.5">
              {WEEKDAY_LABELS.map((label, index) => (
                <span
                  key={label}
                  className="flex h-3.5 w-6 items-center text-[10px] text-gray-500"
                >
                  {index % 2 === 0 ? label : ''}
                </span>
              ))}
            </div>

            <div className="flex gap-1">
              {Array.from({ length: heatmap.weeks }, (_, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                  {heatmap.grid.map((row) => {
                    const cell = row[weekIndex];

                    return (
                      <div
                        key={cell.dateKey}
                        className={`h-3.5 w-3.5 rounded-sm transition-colors ${getHeatmapCellClass(cell.count, cell.isFuture)}`}
                        title={
                          cell.isFuture
                            ? undefined
                            : `${formatHeatmapDate(cell.date)} · ${cell.count} note${cell.count === 1 ? '' : 's'}`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-gray-400">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <span className="h-3.5 w-3.5 rounded-sm bg-[#18181c] border border-[#222226]" />
          <span className="h-3.5 w-3.5 rounded-sm bg-[#00eaff]/25 border border-[#00eaff]/10" />
          <span className="h-3.5 w-3.5 rounded-sm bg-[#00eaff]/60 border border-[#00eaff]/20" />
          <span className="h-3.5 w-3.5 rounded-sm bg-[#00eaff] shadow-[0_0_10px_#00eaff]" />
        </div>
        <span>More</span>
        <span className="ml-auto text-gray-500">
          {heatmap.activeDays} active days · best streak {heatmap.longestStreak} days
        </span>
      </div>
    </section>
  );
}

function InputMethodBar({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}): ReactElement {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-500">
          {value} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#0d0d0f]">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsView({ notes, isLoading }: AnalyticsViewProps): ReactElement {
  const languageBreakdown = useMemo(
    () => computeLanguageBreakdown(notes),
    [notes],
  );
  const heatmap = useMemo(() => computeActivityHeatmap(notes), [notes]);
  const timeSavedHours = useMemo(
    () => computeEstimatedTimeSavedHours(notes),
    [notes],
  );
  const inputMethods = useMemo(
    () => computeInputMethodBreakdown(notes),
    [notes],
  );
  const totalNotes = notes.length;
  const inputTotal = inputMethods.code + inputMethods.image + inputMethods.tab;

  const pieData = languageBreakdown.map((item) => ({
    name: item.name,
    value: item.count,
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Analytics &amp; Insights
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          Overview of your code snippets, technology stack, and productivity.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-[#1c1c20] bg-[#141417] p-10 text-center text-sm text-gray-400">
          Loading analytics…
        </div>
      ) : totalNotes === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1c1c20] bg-[#141417] p-10 text-center text-sm text-gray-400">
          Add your first note to unlock analytics insights.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-[#1c1c20] bg-[#141417] p-5 lg:col-span-1">
              <h2 className="mb-1 text-sm font-semibold text-white">Language Breakdown</h2>
              <p className="mb-4 text-xs text-gray-400">Your stack at a glance</p>

              <div className="relative mx-auto h-40 w-full max-w-[180px]">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={pieData}
                      dataKey="value"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                      stroke="#0d0d0f"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ANALYTICS_CHART_COLORS[
                              index % ANALYTICS_CHART_COLORS.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<AnalyticsTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold text-white">{totalNotes}</span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-gray-400">
                    notes
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {languageBreakdown.slice(0, 4).map((item, index) => (
                  <li
                    key={item.slug}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            ANALYTICS_CHART_COLORS[
                              index % ANALYTICS_CHART_COLORS.length
                            ],
                        }}
                      />
                      <span className="truncate text-gray-300">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-gray-500">{item.percentage}%</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[#1c1c20] bg-[#141417] p-5 lg:col-span-2">
              <h2 className="mb-1 text-sm font-semibold text-white">Streak &amp; Momentum</h2>
              <p className="mb-5 text-xs text-gray-400">
                Consistency metrics from your capture history
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <article className="rounded-xl border border-[#1c1c20] bg-[#0d0d0f] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
                    Current Streak
                  </p>
                  <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-semibold text-[#00eaff]">
                    {heatmap.currentStreak}
                    <span className="inline-flex items-center gap-1 text-base text-gray-400">
                      days
                      <FlameIcon className="h-4 w-4 text-[#00eaff] drop-shadow-[0_0_6px_#00eaff]" />
                    </span>
                  </p>
                </article>

                <article className="rounded-xl border border-[#1c1c20] bg-[#0d0d0f] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
                    Best Streak
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {heatmap.longestStreak}
                    <span className="ml-1 text-base text-gray-400">days</span>
                  </p>
                </article>

                <article className="rounded-xl border border-[#1c1c20] bg-[#0d0d0f] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
                    Active Days
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {heatmap.activeDays}
                    <span className="ml-1 text-base text-gray-400">total</span>
                  </p>
                </article>
              </div>

              <div className="mt-4 rounded-xl border border-[#1c1c20] bg-[#0d0d0f] px-4 py-3">
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-white">{languageBreakdown.length}</span>{' '}
                  languages in your library ·{' '}
                  <span className="font-medium text-[#00eaff]">
                    {languageBreakdown[0]?.name ?? 'N/A'}
                  </span>{' '}
                  is your primary stack
                </p>
              </div>
            </section>
          </div>

          <ActivityHeatmap notes={notes} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-[#1c1c20] bg-[#141417] p-5">
              <h2 className="mb-1 text-sm font-semibold text-white">
                Estimated Time Saved
              </h2>
              <p className="mb-4 text-xs text-gray-400">
                based on average 15m context lookup per saved solution
              </p>
              <p className="text-4xl font-semibold tracking-tight text-[#00eaff]">
                {timeSavedHours} hrs
              </p>
              <p className="mt-2 text-xs text-gray-500">
                From {totalNotes} saved note{totalNotes === 1 ? '' : 's'} in your library
              </p>
            </section>

            <section className="rounded-2xl border border-[#1c1c20] bg-[#141417] p-5">
              <h2 className="mb-1 text-sm font-semibold text-white">
                Input Methods Breakdown
              </h2>
              <p className="mb-4 text-xs text-gray-400">
                How you capture knowledge into SyntaxAI
              </p>

              <div className="space-y-3">
                <InputMethodBar
                  colorClass="bg-[#00eaff]"
                  label="Code snippets"
                  total={inputTotal}
                  value={inputMethods.code}
                />
                <InputMethodBar
                  colorClass="bg-[#00eaff]/60"
                  label="Image OCR"
                  total={inputTotal}
                  value={inputMethods.image}
                />
                <InputMethodBar
                  colorClass="bg-[#00eaff]/30"
                  label="Tab Context"
                  total={inputTotal}
                  value={inputMethods.tab}
                />
              </div>

              {inputMethods.image === 0 && inputMethods.tab === 0 ? (
                <p className="mt-3 text-[11px] text-gray-500">
                  OCR and tab context tracking will appear as those flows ship.
                </p>
              ) : null}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
