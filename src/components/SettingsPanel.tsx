import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import {
  ensureOpenAiApiKeyLoaded,
  getApiKeyStatus,
  getOpenAiApiKey,
  loadOpenAiApiKeyFromStorage,
  maskApiKey,
  OPENAI_API_KEY_ENV_HINT,
  saveOpenAiApiKey,
} from '../services/apiKeyStorage';
import {
  getCaptureSettings,
  updateCaptureSettings,
  type CaptureSettings,
} from '../storage/captureSettingsStorage';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { exportNotesToJsonFile } from '../utils/exportNotes';
import { openPricingPage } from '../utils/openPricingPage';
import { PRO_PLAN } from '../utils/usageLimits';
import { SettingsLanguageControl } from './SettingsLanguageControl';

interface SettingsToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function SettingsToggle({
  checked,
  disabled = false,
  onChange,
}: SettingsToggleProps): ReactElement {
  return (
    <button
      aria-checked={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out ${
        checked ? 'bg-syntax-accent' : 'bg-syntax-border'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ease-out ${
          checked ? 'translate-x-5 bg-syntax-accent-fg' : 'translate-x-0 bg-syntax-text'
        }`}
      />
    </button>
  );
}

function SettingsDivider(): ReactElement {
  return <div aria-hidden="true" className="border-t border-syntax-border" />;
}

function SettingsGroupLabel({ children }: { children: string }): ReactElement {
  return (
    <p className="px-5 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-syntax-muted first:pt-0">
      {children}
    </p>
  );
}

function SettingsRow({
  label,
  description,
  disabled = false,
  trailing,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  trailing: ReactNode;
}): ReactElement {
  return (
    <div
      className={`flex items-center justify-between gap-6 px-5 py-4 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-syntax-text">{label}</p>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-syntax-muted">
          {description}
        </p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}

interface SettingsPanelProps {
  onOpenUsage?: () => void;
  showAlerts?: boolean;
}

export function SettingsPanel({
  onOpenUsage,
  showAlerts = true,
}: SettingsPanelProps): ReactElement {
  const { t } = useTranslation();
  const { isLight, setTheme } = useTheme();
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [status, setStatus] = useState<'active' | 'missing'>('missing');
  const [usingDevEnvKey, setUsingDevEnvKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [captureSettings, setCaptureSettings] = useState<CaptureSettings>({
    enablePasteCapture: true,
    enableContextCapture: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const loadSettings = useCallback((): void => {
    void ensureOpenAiApiKeyLoaded().then(() => {
      const apiKey = getOpenAiApiKey();
      const devKey = import.meta.env.DEV && Boolean(import.meta.env.VITE_OPENAI_API_KEY?.trim());

      setUsingDevEnvKey(devKey);
      setStatus(getApiKeyStatus());
      setKeyPreview(apiKey ? maskApiKey(apiKey) : null);
      setError(null);
      setSuccessMessage(null);
    });

    void getCaptureSettings().then(setCaptureSettings);
  }, []);

  const handleSaveApiKey = useCallback((): void => {
    setIsSavingApiKey(true);
    setError(null);
    setSuccessMessage(null);

    void saveOpenAiApiKey(apiKeyDraft)
      .then(() => loadOpenAiApiKeyFromStorage())
      .then(() => {
        setApiKeyDraft('');
        setSuccessMessage(t('settingsOpenAiSaved'));
        loadSettings();
      })
      .catch(() => {
        setError('Failed to save API key.');
      })
      .finally(() => {
        setIsSavingApiKey(false);
      });
  }, [apiKeyDraft, loadSettings, t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggleLightMode = async (enabled: boolean): Promise<void> => {
    setError(null);
    await setTheme(enabled ? 'light' : 'dark');
  };

  const handleCaptureSettingChange = async (
    key: keyof CaptureSettings,
    enabled: boolean,
  ): Promise<void> => {
    setError(null);
    setCaptureSettings((current) => ({ ...current, [key]: enabled }));

    try {
      const patch: Partial<CaptureSettings> = { [key]: enabled };
      const next = await updateCaptureSettings(patch);
      setCaptureSettings(next);
    } catch (toggleError) {
      setCaptureSettings((current) => ({ ...current, [key]: !enabled }));
      setError(
        toggleError instanceof Error ? toggleError.message : t('settingsCaptureError'),
      );
    }
  };

  const handleExportNotes = async (): Promise<void> => {
    setIsExporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const count = await exportNotesToJsonFile();
      setSuccessMessage(t('settingsExportSuccess', { count }));
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : t('settingsExportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenUsage = (): void => {
    onOpenUsage?.();
  };

  return (
    <div>
      {showAlerts && error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      ) : null}
      {showAlerts && successMessage ? (
        <p className="mb-4 rounded-xl border border-syntax-accent/20 bg-syntax-accent/10 px-3 py-2 text-xs text-syntax-accent">
          {successMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-syntax-border bg-syntax-card">
        <SettingsGroupLabel>{t('settingsGroupAppearance')}</SettingsGroupLabel>

        <SettingsRow
          description={t('settingsLanguageDesc')}
          label={t('settingsLanguageLabel')}
          trailing={<SettingsLanguageControl />}
        />

        <SettingsDivider />

        <SettingsRow
          description={t('settingsLightModeDesc')}
          label={t('settingsLightModeLabel')}
          trailing={
            <SettingsToggle
              checked={isLight}
              onChange={(enabled) => {
                void handleToggleLightMode(enabled);
              }}
            />
          }
        />

        <SettingsDivider />
        <SettingsGroupLabel>{t('settingsGroupCapture')}</SettingsGroupLabel>

        <SettingsRow
          description={t('settingsContextCaptureDesc')}
          label={t('settingsContextCaptureLabel')}
          trailing={
            <SettingsToggle
              checked={captureSettings.enableContextCapture}
              onChange={(enabled) => {
                void handleCaptureSettingChange('enableContextCapture', enabled);
              }}
            />
          }
        />

        <SettingsDivider />
        <SettingsGroupLabel>{t('settingsGroupAi')}</SettingsGroupLabel>

        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-syntax-text">{t('settingsOpenAiLabel')}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                status === 'active'
                  ? 'bg-syntax-accent/10 text-syntax-accent'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {status === 'active' ? t('settingsOpenAiActive') : t('settingsOpenAiMissing')}
            </span>
          </div>

          {keyPreview ? (
            <p className="mb-2 font-mono text-xs text-syntax-muted">{keyPreview}</p>
          ) : null}

          {usingDevEnvKey ? (
            <p className="mb-3 text-[13px] leading-relaxed text-syntax-muted">
              {t('settingsOpenAiDevEnv')}
            </p>
          ) : (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-syntax-border bg-syntax-bg px-3 py-2 font-mono text-xs text-syntax-text outline-none ring-syntax-accent focus:ring-2"
                onChange={(event) => setApiKeyDraft(event.target.value)}
                placeholder={t('settingsOpenAiPlaceholder')}
                spellCheck={false}
                type="password"
                value={apiKeyDraft}
              />
              <button
                className="syntax-btn-primary shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
                disabled={isSavingApiKey || apiKeyDraft.trim().length === 0}
                onClick={handleSaveApiKey}
                type="button"
              >
                {t('settingsOpenAiSave')}
              </button>
            </div>
          )}

          <p className="text-[13px] leading-relaxed text-syntax-muted">
            {status === 'active'
              ? t('settingsOpenAiStoredLocally')
              : OPENAI_API_KEY_ENV_HINT}
          </p>
        </div>

        <SettingsDivider />
        <SettingsGroupLabel>{t('settingsGroupLibrary')}</SettingsGroupLabel>

        <div className="flex items-center justify-between gap-6 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-syntax-text">{t('settingsExportLabel')}</p>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-syntax-muted">
              {t('settingsExportDesc')}
            </p>
          </div>
          <button
            className="h-9 shrink-0 rounded-full border border-syntax-border px-4 text-[13px] text-syntax-text transition hover:border-syntax-accent/40 hover:text-syntax-accent disabled:opacity-50"
            disabled={isExporting}
            onClick={() => void handleExportNotes()}
            type="button"
          >
            {isExporting ? t('settingsExporting') : t('settingsExportButton')}
          </button>
        </div>

        <SettingsDivider />
        <SettingsGroupLabel>{t('settingsGroupPlan')}</SettingsGroupLabel>

        <div className="px-5 py-4">
          <p className="text-sm font-medium text-syntax-text">{t('settingsFreePlan')}</p>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-syntax-muted">
            {t('settingsFreePlanDesc', {
              price: PRO_PLAN.priceLabel,
              period: PRO_PLAN.periodLabel,
            })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {onOpenUsage ? (
              <button
                className="h-9 rounded-full border border-syntax-border px-4 text-[13px] text-syntax-text transition hover:border-syntax-accent/40 hover:text-syntax-accent"
                onClick={handleOpenUsage}
                type="button"
              >
                {t('settingsViewUsage')}
              </button>
            ) : null}
            <button
              className="h-9 rounded-full bg-syntax-accent px-4 text-[13px] font-semibold text-syntax-accent-fg transition hover:opacity-90"
              onClick={openPricingPage}
              type="button"
            >
              {t('settingsUpgradePro')}
            </button>
          </div>
        </div>

        <SettingsDivider />
        <SettingsGroupLabel>{t('settingsGroupAbout')}</SettingsGroupLabel>

        <dl className="space-y-3 px-5 py-4 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-syntax-muted">{t('settingsVersion')}</dt>
            <dd className="text-syntax-text">{t('settingsVersionValue')}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-syntax-muted">{t('settingsStorage')}</dt>
            <dd className="text-syntax-text">{t('settingsStorageValue')}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
