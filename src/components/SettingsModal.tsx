import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import {
  getApiKeyStatus,
  getOpenAiApiKey,
  maskApiKey,
  OPENAI_API_KEY_ENV_HINT,
} from '../services/apiKeyStorage';
import {
  getCaptureSettings,
  setIncludeContextDescription,
} from '../storage/captureSettingsStorage';
import { useTheme } from '../hooks/useTheme';
import { exportNotesToJsonFile } from '../utils/exportNotes';
import { PRO_PLAN } from '../utils/usageLimits';

interface SettingsToggleProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}

function SettingsToggle({
  checked,
  disabled = false,
  label,
  description,
  onChange,
}: SettingsToggleProps): ReactElement {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-syntax-text">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-syntax-muted">
          {description}
        </span>
      </span>

      <button
        aria-checked={checked}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-syntax-accent' : 'bg-syntax-border'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="rounded-xl border border-syntax-border bg-syntax-bg p-4">
      <h3 className="mb-4 text-sm font-medium text-syntax-text">{title}</h3>
      {children}
    </section>
  );
}

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
  const { isLight, setTheme } = useTheme();
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'missing'>('missing');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [includeContextDescription, setIncludeContextDescriptionState] = useState(true);
  const [isCaptureSettingSaving, setIsCaptureSettingSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadSettings = useCallback((): void => {
    const apiKey = getOpenAiApiKey();

    setStatus(getApiKeyStatus());
    setKeyPreview(apiKey ? maskApiKey(apiKey) : null);
    setError(null);
    setSuccessMessage(null);

    void getCaptureSettings().then((captureSettings) => {
      setIncludeContextDescriptionState(captureSettings.includeContextDescription);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleToggleLightMode = async (enabled: boolean): Promise<void> => {
    setError(null);
    await setTheme(enabled ? 'light' : 'dark');
  };

  const handleToggleContextDescription = async (enabled: boolean): Promise<void> => {
    setIsCaptureSettingSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await setIncludeContextDescription(enabled);
      setIncludeContextDescriptionState(enabled);
      setSuccessMessage('Capture preference saved.');
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Failed to update capture settings.',
      );
    } finally {
      setIsCaptureSettingSaving(false);
    }
  };

  const handleExportNotes = async (): Promise<void> => {
    setIsExporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const count = await exportNotesToJsonFile();
      setSuccessMessage(`Exported ${count} note${count === 1 ? '' : 's'}.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenUsage = (): void => {
    onClose();
    onOpenUsage?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-syntax-overlay p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="settings-modal-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-syntax-border bg-syntax-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-syntax-text" id="settings-modal-title">
              Settings
            </h2>
            <p className="mt-1 text-sm text-syntax-muted">
              Appearance, capture behavior, and library tools.
            </p>
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

        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mb-4 rounded-xl border border-syntax-accent/20 bg-syntax-accent/10 px-3 py-2 text-xs text-syntax-accent">
            {successMessage}
          </p>
        ) : null}

        <div className="space-y-4">
          <SettingsSection title="Appearance">
            <SettingsToggle
              checked={isLight}
              description="Switch between the dark developer theme and a clean light workspace."
              label="Light mode"
              onChange={(enabled) => {
                void handleToggleLightMode(enabled);
              }}
            />
          </SettingsSection>

          <SettingsSection title="Capture">
            <SettingsToggle
              checked={includeContextDescription}
              description="Save surrounding docs and rules in the Context field. Turn off for code-only notes."
              disabled={isCaptureSettingSaving}
              label="Save page description"
              onChange={(enabled) => {
                void handleToggleContextDescription(enabled);
              }}
            />
          </SettingsSection>

          <SettingsSection title="AI">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-syntax-text">OpenAI connection</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  status === 'active'
                    ? 'bg-syntax-accent/10 text-syntax-accent'
                    : 'bg-red-500/10 text-red-300'
                }`}
              >
                {status === 'active' ? 'Active' : 'Missing'}
              </span>
            </div>

            {keyPreview ? (
              <p className="mb-2 font-mono text-xs text-syntax-muted">
                From <code className="text-syntax-text">.env</code>: {keyPreview}
              </p>
            ) : null}

            <p className="text-xs leading-relaxed text-syntax-muted">
              {status === 'active'
                ? 'Dev key is loaded from .env at build time.'
                : OPENAI_API_KEY_ENV_HINT}
            </p>
          </SettingsSection>

          <SettingsSection title="Library">
            <p className="mb-3 text-xs leading-relaxed text-syntax-muted">
              Download your notes as JSON for backup or migration.
            </p>
            <button
              className="h-10 rounded-full border border-syntax-border px-4 text-sm text-syntax-text transition hover:border-syntax-accent/40 hover:text-syntax-accent disabled:opacity-50"
              disabled={isExporting}
              onClick={() => void handleExportNotes()}
              type="button"
            >
              {isExporting ? 'Exporting…' : 'Export notes (.json)'}
            </button>
          </SettingsSection>

          <SettingsSection title="Plan">
            <p className="mb-3 text-sm text-syntax-text">You&apos;re on the Free plan.</p>
            <p className="mb-4 text-xs leading-relaxed text-syntax-muted">
              30 notes · 10 context captures · 10 photo reads. Pro removes all limits for{' '}
              {PRO_PLAN.priceLabel}
              {PRO_PLAN.periodLabel}.
            </p>
            <div className="flex flex-wrap gap-2">
              {onOpenUsage ? (
                <button
                  className="h-10 rounded-full border border-syntax-border px-4 text-sm text-syntax-text transition hover:border-syntax-accent/40 hover:text-syntax-accent"
                  onClick={handleOpenUsage}
                  type="button"
                >
                  View usage
                </button>
              ) : null}
              <button
                className="h-10 rounded-full bg-syntax-accent px-4 text-sm font-semibold text-black transition hover:opacity-90"
                onClick={handleOpenUsage}
                type="button"
              >
                Upgrade to Pro
              </button>
            </div>
          </SettingsSection>

          <SettingsSection title="About">
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-syntax-muted">Version</dt>
                <dd className="text-syntax-text">0.1.0 early access</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-syntax-muted">Storage</dt>
                <dd className="text-syntax-text">Local-first · chrome.storage</dd>
              </div>
            </dl>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
