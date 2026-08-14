import { useMemo, type ReactElement } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Note } from '../../types/note';
import { useTranslation } from '../../hooks/useTranslation';
import type { TranslationKey } from '../../i18n/translations';
import type { Locale } from '../../storage/localeStorage';
import {
  computeActivityHeatmap,
  computeEstimatedTimeSavedHours,
  computeInputMethodBreakdown,
  computeLanguageBreakdown,
  formatHeatmapDate,
  getHeatmapCellClass,
  groupBreakdownForChart,
} from '../../utils/analyticsHelpers';
import { TechIcon } from '../../components/TechIcon';
import { UsageSection } from './UsageSection';
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
    color?: string;
  };
}

const WEEKDAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const WEEKDAY_LABELS_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] as const;

function getWeekdayLabels(locale: Locale): readonly string[] {
  return locale === 'uk' ? WEEKDAY_LABELS_UK : WEEKDAY_LABELS_EN;
}

function getDateLocale(locale: Locale): string {
  return locale === 'uk' ? 'uk-UA' : 'en-US';
}

type TranslateFn = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

function AnalyticsTooltip({
  active,
  payload,
  t,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  t: TranslateFn;
}): ReactElement | null {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const count = item.payload?.count ?? item.value ?? 0;
  const percentage = item.payload?.percentage;
  const accentColor = item.payload?.color ?? '#00eaff';

  return (
    <div className="relative z-50 rounded-xl border border-syntax-border bg-syntax-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-syntax-text">{item.name}</p>
      <p className="mt-0.5" style={{ color: accentColor }}>
        {percentage !== undefined
          ? t('analyticsNotesTooltip', { count, percentage })
          : t('analyticsNotesTooltipCount', { count })}
      </p>
    </div>
  );
}

function ActivityHeatmap({
  notes,
  t,
  locale,
}: {
  notes: Note[];
  t: TranslateFn;
  locale: Locale;
}): ReactElement {
  const heatmap = useMemo(() => computeActivityHeatmap(notes), [notes]);
  const weekdayLabels = getWeekdayLabels(locale);
  const dateLocale = getDateLocale(locale);

  const noteUnit = (count: number): string =>
    count === 1 ? t('analyticsDay') : t('analyticsDays');

  return (
    <section className="rounded-2xl border border-syntax-border bg-syntax-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-syntax-text">{t('analyticsCaptureActivity')}</h2>
          <p className="mt-1 text-xs text-syntax-muted">
            {t('analyticsCaptureActivityDesc', { weeks: heatmap.weeks })}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-syntax-accent/30 bg-syntax-accent/10 px-3 py-1 text-xs font-medium text-syntax-accent">
          {t('analyticsCurrentStreakBadge', {
            count: heatmap.currentStreak,
            unit: noteUnit(heatmap.currentStreak),
          })}
          <FlameIcon className="h-3.5 w-3.5 text-syntax-accent drop-shadow-[0_0_6px_var(--syntax-accent)]" />
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
                  className="flex h-3 w-3.5 items-start justify-center text-[10px] text-syntax-muted"
                >
                  {showLabel && firstCell
                    ? firstCell.date.toLocaleDateString(dateLocale, { month: 'short' })
                    : ''}
                </span>
              );
            })}
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 pt-0.5">
              {weekdayLabels.map((label, index) => (
                <span
                  key={label}
                  className="flex h-3.5 w-6 items-center text-[10px] text-syntax-muted"
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
                            : t('analyticsHeatmapTooltip', {
                                date: formatHeatmapDate(cell.date, dateLocale),
                                count: cell.count,
                                unit: noteUnit(cell.count),
                              })
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

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-syntax-muted">
        <span>{t('analyticsLess')}</span>
        <div className="flex items-center gap-1">
          <span className="h-3.5 w-3.5 rounded-sm border border-syntax-heatmap-1-border bg-syntax-heatmap-1" />
          <span className="h-3.5 w-3.5 rounded-sm border border-syntax-heatmap-2-border bg-syntax-heatmap-2" />
          <span className="h-3.5 w-3.5 rounded-sm border border-syntax-heatmap-3-border bg-syntax-heatmap-3 shadow-[0_0_10px_var(--syntax-heatmap-3)]" />
        </div>
        <span>{t('analyticsMore')}</span>
        <span className="ml-auto text-syntax-muted">
          {t('analyticsActiveDaysSummary', {
            activeDays: heatmap.activeDays,
            longestStreak: heatmap.longestStreak,
          })}
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
        <span className="text-syntax-muted">{label}</span>
        <span className="text-syntax-muted">
          {value} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-syntax-inset">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsView({ notes, isLoading }: AnalyticsViewProps): ReactElement {
  const { t, locale } = useTranslation();
  const languageBreakdown = useMemo(
    () => computeLanguageBreakdown(notes),
    [notes],
  );
  const stackChartData = useMemo(
    () => groupBreakdownForChart(languageBreakdown),
    [languageBreakdown],
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

  const pieData = stackChartData.map((item) => ({
    name: item.name,
    value: item.count,
    count: item.count,
    percentage: item.percentage,
    color: item.color,
    slug: item.slug,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-syntax-text">
          {t('analyticsUsageTitle')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-syntax-muted">{t('analyticsUsageSubtitle')}</p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-syntax-border bg-syntax-card p-10 text-center text-sm text-syntax-muted">
          {t('analyticsLoading')}
        </div>
      ) : totalNotes === 0 ? (
        <>
          <div className="rounded-2xl border border-dashed border-syntax-border bg-syntax-card p-10 text-center text-sm text-syntax-muted">
            {t('analyticsEmpty')}
          </div>
          <UsageSection isLoading={isLoading} notes={notes} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-syntax-border bg-syntax-card p-5 lg:col-span-1">
              <h2 className="mb-1 text-sm font-semibold text-syntax-text">
                {t('analyticsStackBreakdown')}
              </h2>
              <p className="mb-4 text-xs text-syntax-muted">{t('analyticsStackBreakdownDesc')}</p>

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
                      stroke="var(--syntax-bg)"
                      strokeWidth={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.slug} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<AnalyticsTooltip t={t} />}
                      wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold text-syntax-text">{totalNotes}</span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-syntax-muted">
                    {t('analyticsNotes')}
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {stackChartData.map((item) => (
                  <li
                    key={item.slug}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {item.slug === '__other__' ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      ) : (
                        <span
                          className="rounded-md ring-2 ring-offset-1 ring-offset-syntax-card"
                          style={{ boxShadow: `0 0 0 2px ${item.color}` }}
                        >
                          <TechIcon size="xs" tech={item.slug} />
                        </span>
                      )}
                      <span className="truncate text-syntax-muted">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-syntax-muted">{item.percentage}%</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-syntax-border bg-syntax-card p-5 lg:col-span-2">
              <h2 className="mb-1 text-sm font-semibold text-syntax-text">
                {t('analyticsStreakMomentum')}
              </h2>
              <p className="mb-5 text-xs text-syntax-muted">{t('analyticsStreakMomentumDesc')}</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <article className="rounded-xl border border-syntax-border bg-syntax-inset p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-syntax-muted">
                    {t('analyticsCurrentStreak')}
                  </p>
                  <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-semibold text-syntax-accent">
                    {heatmap.currentStreak}
                    <span className="inline-flex items-center gap-1 text-base text-syntax-muted">
                      {t('analyticsDays')}
                      <FlameIcon className="h-4 w-4 text-syntax-accent drop-shadow-[0_0_6px_var(--syntax-accent)]" />
                    </span>
                  </p>
                </article>

                <article className="rounded-xl border border-syntax-border bg-syntax-inset p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-syntax-muted">
                    {t('analyticsBestStreak')}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-syntax-text">
                    {heatmap.longestStreak}
                    <span className="ml-1 text-base text-syntax-muted">{t('analyticsDays')}</span>
                  </p>
                </article>

                <article className="rounded-xl border border-syntax-border bg-syntax-inset p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-syntax-muted">
                    {t('analyticsActiveDays')}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-syntax-text">
                    {heatmap.activeDays}
                    <span className="ml-1 text-base text-syntax-muted">{t('analyticsTotal')}</span>
                  </p>
                </article>
              </div>

              <div className="mt-4 rounded-xl border border-syntax-border bg-syntax-inset px-4 py-3">
                <p className="text-xs text-syntax-muted">
                  {t('analyticsTechInLibrary', { count: languageBreakdown.length })}{' '}
                  <span
                    className="font-medium"
                    style={{ color: languageBreakdown[0]?.color ?? '#00eaff' }}
                  >
                    {languageBreakdown[0]?.name ?? 'N/A'}
                  </span>{' '}
                  {t('analyticsPrimaryStack')}
                </p>
              </div>
            </section>
          </div>

          <UsageSection isLoading={isLoading} notes={notes} />

          <ActivityHeatmap locale={locale} notes={notes} t={t} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-syntax-border bg-syntax-card p-5">
              <h2 className="mb-1 text-sm font-semibold text-syntax-text">
                {t('analyticsTimeSaved')}
              </h2>
              <p className="mb-4 text-xs text-syntax-muted">{t('analyticsTimeSavedDesc')}</p>
              <p className="text-4xl font-semibold tracking-tight text-syntax-accent">
                {timeSavedHours} hrs
              </p>
              <p className="mt-2 text-xs text-syntax-muted">
                {t('analyticsTimeSavedFrom', { count: totalNotes })}
              </p>
            </section>

            <section className="rounded-2xl border border-syntax-border bg-syntax-card p-5">
              <h2 className="mb-1 text-sm font-semibold text-syntax-text">
                {t('analyticsInputMethods')}
              </h2>
              <p className="mb-4 text-xs text-syntax-muted">{t('analyticsInputMethodsDesc')}</p>

              <div className="space-y-3">
                <InputMethodBar
                  colorClass="bg-syntax-accent"
                  label={t('analyticsCodeSnippets')}
                  total={inputTotal}
                  value={inputMethods.code}
                />
                <InputMethodBar
                  colorClass="bg-syntax-accent/60"
                  label={t('analyticsImageOcr')}
                  total={inputTotal}
                  value={inputMethods.image}
                />
                <InputMethodBar
                  colorClass="bg-syntax-accent/30"
                  label={t('analyticsTabContext')}
                  total={inputTotal}
                  value={inputMethods.tab}
                />
              </div>

              {inputMethods.image === 0 && inputMethods.tab === 0 ? (
                <p className="mt-3 text-[11px] text-syntax-muted">{t('analyticsOcrTabHint')}</p>
              ) : null}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
