export const CAPTURE_SETTINGS_STORAGE_KEY = 'syntaxai_capture_settings';

export const CAPTURE_SETTINGS_CHANGED_EVENT = 'syntaxai-capture-settings-changed';

export interface CaptureSettings {
  /** Paste code, text, or screenshots in the side panel. */
  enablePasteCapture: boolean;
  /** AI writes note body / explanations for page selection capture. */
  enableContextCapture: boolean;
  /** AI shows and saves a short explanation for paste / image analyze. */
  enablePasteExplanations: boolean;
}

const DEFAULT_CAPTURE_SETTINGS: CaptureSettings = {
  enablePasteCapture: true,
  enableContextCapture: true,
  enablePasteExplanations: true,
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
    enablePasteCapture:
      typeof record.enablePasteCapture === 'boolean'
        ? record.enablePasteCapture
        : DEFAULT_CAPTURE_SETTINGS.enablePasteCapture,
    enableContextCapture:
      typeof record.enableContextCapture === 'boolean'
        ? record.enableContextCapture
        : typeof record.includeContextDescription === 'boolean'
          ? record.includeContextDescription
          : DEFAULT_CAPTURE_SETTINGS.enableContextCapture,
    enablePasteExplanations:
      typeof record.enablePasteExplanations === 'boolean'
        ? record.enablePasteExplanations
        : DEFAULT_CAPTURE_SETTINGS.enablePasteExplanations,
  };
}

function notifyCaptureSettingsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CAPTURE_SETTINGS_CHANGED_EVENT));
  }
}

export async function getCaptureSettings(): Promise<CaptureSettings> {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(CAPTURE_SETTINGS_STORAGE_KEY);
    return normalizeCaptureSettings(result[CAPTURE_SETTINGS_STORAGE_KEY]);
  }

  if (typeof localStorage === 'undefined') {
    return DEFAULT_CAPTURE_SETTINGS;
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

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CAPTURE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  notifyCaptureSettingsChanged();
}

export async function updateCaptureSettings(
  patch: Partial<CaptureSettings>,
): Promise<CaptureSettings> {
  const current = await getCaptureSettings();
  const next = { ...current, ...patch };
  await saveCaptureSettings(next);
  return next;
}

export async function isContextCaptureEnabled(): Promise<boolean> {
  const settings = await getCaptureSettings();
  return settings.enableContextCapture;
}
