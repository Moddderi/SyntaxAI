import { useCallback, useEffect, useState, type ReactElement } from 'react';
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
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-gray-500">{description}</span>
      </span>

      <button
        aria-checked={checked}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-[#00eaff]' : 'bg-[#1c1c20]'
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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): ReactElement | null {
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'missing'>('missing');
  const [error, setError] = useState<string | null>(null);
  const [includeContextDescription, setIncludeContextDescriptionState] = useState(true);
  const [isCaptureSettingSaving, setIsCaptureSettingSaving] = useState(false);

  const loadSettings = useCallback((): void => {
    const apiKey = getOpenAiApiKey();

    setStatus(getApiKeyStatus());
    setKeyPreview(apiKey ? maskApiKey(apiKey) : null);
    setError(null);

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

  const handleToggleContextDescription = async (enabled: boolean): Promise<void> => {
    setIsCaptureSettingSaving(true);
    setError(null);

    try {
      await setIncludeContextDescription(enabled);
      setIncludeContextDescriptionState(enabled);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="settings-modal-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-[#1c1c20] bg-[#141417] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white" id="settings-modal-title">
              Settings
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              OpenAI integration and context capture preferences.
            </p>
          </div>
          <button
            aria-label="Close settings"
            className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-[#0d0d0f] hover:text-white"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <section className="rounded-xl border border-[#1c1c20] bg-[#0d0d0f] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-white">OpenAI API Key</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                status === 'active'
                  ? 'bg-[#00eaff]/10 text-[#00eaff]'
                  : 'bg-red-500/10 text-red-300'
              }`}
            >
              {status === 'active' ? 'Active' : 'Missing'}
            </span>
          </div>

          {keyPreview ? (
            <p className="mb-3 font-mono text-xs text-gray-400">
              From <code className="text-gray-300">.env</code>:{' '}
              <span className="text-gray-300">{keyPreview}</span>
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-gray-500">
            {status === 'active'
              ? 'Key is loaded from VITE_OPENAI_API_KEY in .env at build time. Update .env and rebuild to change it.'
              : OPENAI_API_KEY_ENV_HINT}
          </p>
        </section>

        <section className="mt-4 rounded-xl border border-[#1c1c20] bg-[#0d0d0f] p-4">
          <h3 className="mb-4 text-sm font-medium text-white">Context Capture</h3>

          {error ? <p className="mb-3 text-xs text-red-300">{error}</p> : null}

          <SettingsToggle
            checked={includeContextDescription}
            description="When enabled, SyntaxAI saves surrounding docs text in the Context field. Turn off to capture only title and code."
            disabled={isCaptureSettingSaving}
            label="Save page description"
            onChange={(enabled) => {
              void handleToggleContextDescription(enabled);
            }}
          />
        </section>
      </div>
    </div>
  );
}
