import type { ReactElement } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { useTranslation } from '../hooks/useTranslation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUsage?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onOpenUsage,
}: SettingsModalProps): ReactElement | null {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-syntax-overlay p-4 pt-[8vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="settings-modal-title"
        aria-modal="true"
        className="w-full max-w-2xl rounded-2xl border border-syntax-border bg-syntax-bg p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-syntax-text" id="settings-modal-title">
              {t('settingsTitle')}
            </h2>
            <p className="mt-1 text-sm text-syntax-muted">{t('settingsModalSubtitle')}</p>
          </div>
          <button
            aria-label="Close settings"
            className="rounded-lg px-2 py-1 text-syntax-muted transition hover:bg-syntax-hover hover:text-syntax-text"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <SettingsPanel onOpenUsage={onOpenUsage} showAlerts />
      </div>
    </div>
  );
}
