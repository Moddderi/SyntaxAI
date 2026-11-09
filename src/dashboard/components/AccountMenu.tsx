import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { clearAuthCredentials } from '../../storage/authStorage';
import { ProfileServiceError, updateDisplayName } from '../../services/profileService';
import { getUserDisplayName, getUserInitials } from '../../utils/userDisplay';
import type { SyntaxAiSessionUser } from '../../types/api';
import { ChevronDownIcon, EditIcon, LogoutIcon } from './icons';

interface AccountMenuProps {
  user: SyntaxAiSessionUser;
  onUserUpdated: (user: SyntaxAiSessionUser) => void;
  onSignedOut: () => void;
}

export function AccountMenu({
  user,
  onUserUpdated,
  onSignedOut,
}: AccountMenuProps): ReactElement {
  const { t } = useTranslation();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = getUserInitials(user.name, user.email);
  const displayName = getUserDisplayName(user.name, user.email);

  const closeMenu = useCallback((): void => {
    setIsOpen(false);
    setIsEditingName(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  useEffect(() => {
    setDraftName(user.name ?? '');
  }, [user.name]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await clearAuthCredentials();
    closeMenu();
    onSignedOut();
  }, [closeMenu, onSignedOut]);

  const handleSaveName = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const nextName = draftName.trim();

      if (nextName.length === 0) {
        setError(t('accountNameRequired'));
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const updated = await updateDisplayName(nextName);
        onUserUpdated(updated);
        setIsEditingName(false);
        setIsOpen(false);
      } catch (saveError) {
        if (saveError instanceof ProfileServiceError) {
          setError(saveError.message);
        } else {
          setError(t('accountNameSaveError'));
        }
      } finally {
        setIsSaving(false);
      }
    },
    [draftName, onUserUpdated, t],
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('accountMenuAria')}
        className="syntax-elevated flex h-10 items-center gap-1.5 rounded-full border border-syntax-border bg-syntax-card pl-1 pr-2.5 text-syntax-text transition hover:border-syntax-accent/25"
        onClick={() => {
          setIsOpen((current) => !current);
          setIsEditingName(false);
          setError(null);
        }}
        type="button"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-syntax-inset text-[11px] font-semibold uppercase tracking-wide text-syntax-text">
          {initials}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-syntax-muted transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-syntax-border bg-syntax-card shadow-[var(--syntax-glow)]"
          id={menuId}
          role="menu"
        >
          <div className="border-b border-syntax-border px-3.5 py-3">
            <p className="truncate text-[13px] font-medium text-syntax-text">{displayName}</p>
            <p className="mt-0.5 truncate text-[11px] text-syntax-muted">{user.email}</p>
          </div>

          {isEditingName ? (
            <form className="space-y-2 px-3.5 py-3" onSubmit={(event) => void handleSaveName(event)}>
              <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-syntax-muted">
                {t('accountEditDisplayName')}
                <input
                  autoFocus
                  className="syntax-elevated mt-1.5 h-9 w-full rounded-xl border border-syntax-border bg-syntax-bg px-3 text-[13px] text-syntax-text outline-none transition focus:border-syntax-accent/40"
                  maxLength={80}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder={t('accountNamePlaceholder')}
                  type="text"
                  value={draftName}
                />
              </label>
              {error ? <p className="text-[11px] text-red-400">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  className="syntax-btn-primary flex-1 rounded-full px-3 py-1.5 text-[11px] disabled:opacity-50"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? t('accountNameSaving') : t('accountNameSave')}
                </button>
                <button
                  className="rounded-full border border-syntax-border px-3 py-1.5 text-[11px] text-syntax-muted transition hover:text-syntax-text"
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditingName(false);
                    setDraftName(user.name ?? '');
                    setError(null);
                  }}
                  type="button"
                >
                  {t('accountNameCancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-1.5">
              <button
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] text-syntax-text transition hover:bg-syntax-inset"
                onClick={() => {
                  setIsEditingName(true);
                  setDraftName(user.name ?? '');
                  setError(null);
                }}
                role="menuitem"
                type="button"
              >
                <EditIcon className="h-4 w-4 shrink-0 text-syntax-muted" />
                {t('accountEditDisplayName')}
              </button>

              <div className="my-1 border-t border-syntax-border" />

              <button
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] text-syntax-text transition hover:bg-syntax-inset"
                onClick={() => void handleSignOut()}
                role="menuitem"
                type="button"
              >
                <LogoutIcon className="h-4 w-4 shrink-0 text-syntax-muted" />
                {t('accountLogOut')}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
