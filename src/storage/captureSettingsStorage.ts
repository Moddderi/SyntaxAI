export const CAPTURE_SETTINGS_STORAGE_KEY = 'syntaxai_capture_settings';

export const CAPTURE_SETTINGS_CHANGED_EVENT = 'syntaxai-capture-settings-changed';

export interface CaptureSettings {
  /** When true, context capture saves markdown body (rules, docs text). */
  includeContextDescription: boolean;
}

const DEFAULT_CAPTURE_SETTINGS: CaptureSettings = {
  includeContextDescription: true,
};

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function normalizeCaptureSettings(raw: unknown): CaptureSettings {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_CAPTURE_SETTINGS;
  }

  const record = raw as Record<string, unknown>;

  return {
    includeContextDescription:
      typeof record.includeContextDescription === 'boolean'
        ? record.includeContextDescription
        : DEFAULT_CAPTURE_SETTINGS.includeContextDescription,
  };
}

function notifyCaptureSettingsChanged(): void {
  window.dispatchEvent(new CustomEvent(CAPTURE_SETTINGS_CHANGED_EVENT));
}

export async function getCaptureSettings(): Promise<CaptureSettings> {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(CAPTURE_SETTINGS_STORAGE_KEY);
    return normalizeCaptureSettings(result[CAPTURE_SETTINGS_STORAGE_KEY]);
  }

  const raw = localStorage.getItem(CAPTURE_SETTINGS_STORAGE_KEY);

  if (!raw) {
    return DEFAULT_CAPTURE_SETTINGS;
  }

  try {
    return normalizeCaptureSettings(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_CAPTURE_SETTINGS;
  }
}

export async function saveCaptureSettings(settings: CaptureSettings): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [CAPTURE_SETTINGS_STORAGE_KEY]: settings });
    notifyCaptureSettingsChanged();
    return;
  }

  localStorage.setItem(CAPTURE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  notifyCaptureSettingsChanged();
}

export async function setIncludeContextDescription(enabled: boolean): Promise<void> {
  const current = await getCaptureSettings();
  await saveCaptureSettings({ ...current, includeContextDescription: enabled });
}
