import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from 'react';
import {
  clearOpenAiApiKey,
  getApiKeyStatus,
  getOpenAiApiKey,
  maskApiKey,
  saveOpenAiApiKey,
} from '../services/apiKeyStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): ReactElement | null {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKeyPreview, setSavedKeyPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'missing'>('missing');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async (): Promise<void> => {
    const [savedKey, keyStatus] = await Promise.all([
      getOpenAiApiKey(),
      getApiKeyStatus(),
    ]);

    setStatus(keyStatus);
    setSavedKeyPreview(savedKey ? maskApiKey(savedKey) : null);
    setApiKeyInput('');
    setError(null);
    setSuccessMessage(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadSettings();
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

  const handleSave = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      setError('Enter a valid OpenAI API key.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await saveOpenAiApiKey(trimmedKey);
      await loadSettings();
      setSuccessMessage('API key saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save API key.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await clearOpenAiApiKey();
      await loadSettings();
      setSuccessMessage('API key removed.');
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Failed to remove API key.');
    } finally {
      setIsSaving(false);
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
              Dev-mode configuration for OpenAI integration.
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

          {savedKeyPreview ? (
            <p className="mb-3 font-mono text-xs text-gray-400">
              Saved: <span className="text-gray-300">{savedKeyPreview}</span>
            </p>
          ) : null}

          <form onSubmit={(event) => void handleSave(event)}>
            <label className="mb-2 block text-xs text-gray-400" htmlFor="openai-api-key">
              Paste new key to update
            </label>
            <input
              autoComplete="off"
              className="mb-4 h-11 w-full rounded-xl border border-[#1c1c20] bg-[#141417] px-3 font-mono text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-[#00eaff]/40"
              id="openai-api-key"
              onChange={(event) => setApiKeyInput(event.target.value)}
              placeholder="sk-proj-••••••••"
              spellCheck={false}
              type="password"
              value={apiKeyInput}
            />

            {error ? (
              <p className="mb-3 text-xs text-red-300">{error}</p>
            ) : null}
            {successMessage ? (
              <p className="mb-3 text-xs text-[#00eaff]">{successMessage}</p>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                className="h-10 flex-1 rounded-full bg-[#00eaff] text-sm font-semibold text-black transition hover:bg-[#00eaff]/90 disabled:opacity-50"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Saving…' : 'Save key'}
              </button>
              <button
                className="h-10 rounded-full border border-[#1c1c20] px-4 text-sm text-gray-400 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
                disabled={isSaving || status === 'missing'}
                onClick={() => void handleClear()}
                type="button"
              >
                Clear
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
