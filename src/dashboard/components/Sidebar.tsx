import { useMemo, type ReactElement, type ReactNode } from 'react';
import { Logo } from '../../components/Logo';
import { SyntaxWordmark } from '../../components/SyntaxWordmark';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Note } from '../../types/note';
import { computeLibraryNavCounts } from '../../utils/noteHelpers';
import type { LibraryNavItem, LibraryTabId } from '../types/dashboard.types';
import { SidebarPlanPlaque } from './SidebarPlanPlaque';
import { SidebarBetaPromo } from './SidebarBetaPromo';
import {
  ChartBarIcon,
  GridIcon,
  NotesIcon,
  SettingsIcon,
  StarIcon,
  SunIcon,
} from './icons';

interface SidebarProps {
  notes: Note[];
  isLoading: boolean;
  activeTab: LibraryTabId;
  isSettingsActive: boolean;
  billingEnabled: boolean;
  onTabChange: (tab: LibraryTabId) => void;
  onOpenSettings: () => void;
  onOpenBetaFeedback: () => void;
}

const NAV_ICON_CLASS = 'h-4 w-4 shrink-0';

function SidebarSectionLabel({ children }: { children: string }): ReactElement {
  return (
    <h2 className="syntax-label mb-2.5 px-3 text-syntax-muted">{children}</h2>
  );
}

function SidebarNavButton({
  isActive,
  label,
  count,
  isLoading,
  onClick,
  icon,
}: {
  isActive: boolean;
  label: string;
  count?: number;
  isLoading: boolean;
  onClick: () => void;
  icon: ReactNode;
}): ReactElement {
  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      className={`syntax-press syntax-focus-ring flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[14px] leading-snug ${
        isActive
          ? 'border border-syntax-border bg-syntax-nav-active font-medium text-syntax-text shadow-[inset_3px_0_0_0_var(--syntax-accent)]'
          : 'border border-transparent font-normal text-syntax-muted hover:border-syntax-border hover:bg-syntax-hover hover:text-syntax-text'
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined ? (
        <span
          className={`ml-2 shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums ${
            isActive
              ? 'bg-syntax-accent/10 text-syntax-accent'
              : 'text-syntax-muted'
          }`}
        >
          {isLoading ? '—' : count}
        </span>
      ) : null}
    </button>
  );
}

function LibraryNavIcon({
  id,
  isActive,
}: {
  id: string;
  isActive?: boolean;
}): ReactElement {
  const className = `${NAV_ICON_CLASS} ${isActive ? 'text-syntax-accent' : 'text-current'}`;

  switch (id) {
    case 'starred':
      return <StarIcon className={className} />;
    case 'stack':
      return <GridIcon className={className} />;
    case 'analytics':
      return <ChartBarIcon className={className} />;
    default:
      return <NotesIcon className={className} />;
  }
}

export function Sidebar({
  notes,
  isLoading,
  activeTab,
  isSettingsActive,
  billingEnabled,
  onTabChange,
  onOpenSettings,
  onOpenBetaFeedback,
}: SidebarProps): ReactElement {
  const { isLight, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const libraryCounts = useMemo(() => computeLibraryNavCounts(notes, 0), [notes]);

  const libraryNavItems = useMemo<LibraryNavItem[]>(
    () => [
      {
        id: 'all',
        label: t('navAllNotes'),
        count: libraryCounts.all,
        isActive: activeTab === 'all' && !isSettingsActive,
      },
      {
        id: 'starred',
        label: t('navStarred'),
        count: libraryCounts.starred,
        isActive: activeTab === 'starred' && !isSettingsActive,
      },
      {
        id: 'analytics',
        label: t('navUsage'),
        isActive: activeTab === 'analytics' && !isSettingsActive,
      },
      {
        id: 'stack',
        label: t('navStack'),
        count: libraryCounts.stack,
        isActive: activeTab === 'stack' && !isSettingsActive,
      },
    ],
    [activeTab, isSettingsActive, libraryCounts, t],
  );

  return (
    <aside className="sticky top-0 flex h-screen w-[268px] shrink-0 flex-col border-r border-syntax-border bg-syntax-bg px-4 py-5">
      <div className="mb-5 flex items-center gap-3 px-1">
        <Logo className="h-9 w-9" />
        <div className="min-w-0">
          <h1 className="leading-none">
            <SyntaxWordmark size="md" />
          </h1>
          <p className="syntax-label mt-1 text-[9px] text-syntax-muted">{t('appSubtitle')}</p>
        </div>
      </div>

      <SidebarPlanPlaque
        billingEnabled={billingEnabled}
        onClick={() => onTabChange('analytics')}
      />

      <section className="mb-auto">
        <SidebarSectionLabel>{t('navLibrary')}</SidebarSectionLabel>
        <nav className="flex flex-col gap-0.5">
          {libraryNavItems.map((item) => (
            <SidebarNavButton
              key={item.id}
              count={item.count}
              icon={<LibraryNavIcon id={item.id} isActive={item.isActive} />}
              isActive={Boolean(item.isActive)}
              isLoading={isLoading}
              label={item.label}
              onClick={() => onTabChange(item.id as LibraryTabId)}
            />
          ))}
        </nav>
      </section>

      <SidebarBetaPromo billingEnabled={billingEnabled} onClick={onOpenBetaFeedback} />

      <section className="border-t border-syntax-border pt-4">
        <SidebarSectionLabel>{t('navSettings')}</SidebarSectionLabel>
        <nav className="flex flex-col gap-0.5">
          <SidebarNavButton
            icon={<SettingsIcon className={NAV_ICON_CLASS} />}
            isActive={isSettingsActive}
            isLoading={false}
            label={t('navGeneral')}
            onClick={onOpenSettings}
          />
          <SidebarNavButton
            icon={<SunIcon className={NAV_ICON_CLASS} />}
            isActive={false}
            isLoading={false}
            label={isLight ? t('navDarkMode') : t('navLightMode')}
            onClick={() => {
              void toggleTheme();
            }}
          />
        </nav>
      </section>
    </aside>
  );
}
