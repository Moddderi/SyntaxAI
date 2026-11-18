import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
  createPublicNoteShare,
  revokePublicNoteShare,
  type CreateNoteShareResult,
} from '../services/noteShareService';
import { hasAuthCredentials } from '../storage/authStorage';
import type { Note } from '../types/note';
import { formatNoteDate } from '../utils/noteHelpers';
import { openAuthPage } from '../utils/openAuthPage';

interface ShareNoteModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareNoteModal({ note, isOpen, onClose }: ShareNoteModalProps): ReactElement | null {
  const { t, locale } = useTranslation();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [shareResult, setShareResult] = useState<CreateNoteShareResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setShareResult(null);
    setError(null);
    setIsCopied(false);
    setIsCreating(false);
    setIsRevoking(false);

    void hasAuthCredentials().then(setSignedIn);
  }, [isOpen, note.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCreateShare = useCallback(async (): Promise<void> => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await createPublicNoteShare(note);
      setShareResult(result);
    } catch (caught) {
      const message =
        caught instanceof Error && caught.message.trim()
          ? caught.message
          : t('noteShareError');
      setError(message);
    } finally {
      setIsCreating(false);
    }
  }, [note, t]);

  const handleCopyLink = async (): Promise<void> => {
    if (!shareResult?.url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareResult.url);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  const handleRevoke = async (): Promise<void> => {
    if (!shareResult?.slug) {
      return;
    }

    setIsRevoking(true);
    setError(null);

    try {
      await revokePublicNoteShare(shareResult.slug);
      setShareResult(null);
    } catch (caught) {
      const message =
        caught instanceof Error && caught.message.trim()
          ? caught.message
          : t('noteShareError');
      setError(message);
    } finally {
      setIsRevoking(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-syntax-overlay p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="share-note-title"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-syntax-border bg-syntax-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="syntax-label text-xs text-syntax-muted" id="share-note-title">
              {t('noteShareTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-syntax-muted">{t('noteShareDescription')}</p>
          </div>
          <button
            aria-label="Close share dialog"
            className="rounded-lg px-2 py-1 text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-text"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {signedIn === false ? (
          <div className="space-y-4">
            <p className="text-sm text-syntax-muted">{t('noteShareSignInRequired')}</p>
            <button
              className="syntax-btn-primary h-10 w-full rounded-full text-sm font-semibold"
              onClick={openAuthPage}
              type="button"
            >
              {t('authGateSignIn')}
            </button>
          </div>
        ) : null}

        {signedIn === true && !shareResult ? (
          <div className="space-y-4">
            <button
              className="syntax-btn-primary h-10 w-full rounded-full text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreating}
              onClick={() => void handleCreateShare()}
              type="button"
            >
              {isCreating ? t('noteShareCreating') : t('noteShareCreate')}
            </button>
          </div>
        ) : null}

        {shareResult ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-syntax-border bg-syntax-inset px-3 py-2">
              <p className="break-all font-mono text-xs text-syntax-text">{shareResult.url}</p>
            </div>
            <p className="text-xs text-syntax-muted">
              {t('noteShareExpires', { date: formatNoteDate(shareResult.expiresAt, locale) })}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="syntax-btn-primary h-10 flex-1 rounded-full px-5 text-sm font-semibold"
                onClick={() => void handleCopyLink()}
                type="button"
              >
                {isCopied ? t('noteShareCopied') : t('noteShareCopy')}
              </button>
              <button
                className="h-10 rounded-full border border-syntax-border px-5 text-sm text-syntax-muted transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-60"
                disabled={isRevoking}
                onClick={() => void handleRevoke()}
                type="button"
              >
                {isRevoking ? t('noteShareRevoking') : t('noteShareRevoke')}
              </button>
            </div>
            <button
              className="h-9 w-full rounded-full border border-syntax-border text-xs text-syntax-muted transition hover:border-syntax-accent/40 hover:text-syntax-accent disabled:opacity-60"
              disabled={isCreating}
              onClick={() => void handleCreateShare()}
              type="button"
            >
              {isCreating ? t('noteShareCreating') : t('noteShareRefresh')}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}