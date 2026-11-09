import type { ReactElement } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import type { SyntaxAiSessionUser } from '../../types/api';
import { AccountMenu } from './AccountMenu';
import { BugIcon, LoginIcon, SearchIcon, TrashIcon } from './icons';

interface DashboardTopBarProps {
  onOpenQuickSearch: () => void;
  onOpenTrash: () => void;
  onOpenBugReport: () => void;
  onLoginClick?: () => void;
  signedInUser?: SyntaxAiSessionUser | null;
  onAuthRefresh: () => Promise<void>;
  isTrashActive: boolean;
  isBugReportActive?: boolean;
  trashCount: number;
}

function TopBarIconButton({
  ariaLabel,
  isActive,
  onClick,
  children,
  badge,
}: {
  ariaLabel: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactElement;
  badge?: number;
}): ReactElement {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
        isActive
          ? 'syntax-elevated border-syntax-accent/30 bg-syntax-accent/10 text-syntax-accent'
          : 'syntax-elevated border-syntax-border bg-syntax-card text-syntax-muted hover:border-syntax-accent/20 hover:text-syntax-text'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
      {badge !== undefined && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-syntax-accent px-1 text-[10px] font-semibold text-syntax-accent-fg">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </button>
  );
}

export function DashboardTopBar({
  onOpenQuickSearch,
  onOpenTrash,
  onOpenBugReport,
  onLoginClick,
  signedInUser = null,
  onAuthRefresh,
  isTrashActive,
  isBugReportActive = false,
  trashCount,
}: DashboardTopBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-syntax-muted" />
        <button
          aria-label="Open quick search"
          className="syntax-elevated h-10 w-full rounded-xl border border-syntax-border bg-syntax-card py-2 pl-10 pr-14 text-left text-[13px] text-syntax-muted transition hover:border-syntax-accent/25 hover:text-syntax-text"
          onClick={onOpenQuickSearch}
          type="button"
        >
          {t('topBarSearchPlaceholder')}
        </button>
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-syntax-border bg-syntax-bg px-1.5 py-0.5 text-[10px] text-syntax-muted">
          ⌘K
        </kbd>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          aria-pressed={isBugReportActive}
          className={`flex items-center gap-2 whitespace-nowrap text-[13px] transition ${
            isBugReportActive
              ? 'text-syntax-accent'
              : 'text-syntax-muted hover:text-syntax-text'
          }`}
          onClick={onOpenBugReport}
          type="button"
        >
          <BugIcon className="h-4 w-4 shrink-0" />
          <span className="hidden min-[420px]:inline">{t('topBarReportBug')}</span>
        </button>

        <div className="flex items-center gap-2">
          <TopBarIconButton
            ariaLabel="Open trash"
            badge={trashCount}
            isActive={isTrashActive}
            onClick={onOpenTrash}
          >
            <TrashIcon className="h-[17px] w-[17px]" />
          </TopBarIconButton>

          {signedInUser ? (
            <AccountMenu
              onSignedOut={() => {
                void onAuthRefresh();
              }}
              onUserUpdated={() => {
                void onAuthRefresh();
              }}
              user={signedInUser}
            />
          ) : (
            <button
              className="syntax-btn-primary syntax-focus-ring flex h-10 items-center gap-2 px-3.5 text-[11px]"
              onClick={onLoginClick}
              type="button"
            >
              <LoginIcon className="h-4 w-4" />
              {t('topBarLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
