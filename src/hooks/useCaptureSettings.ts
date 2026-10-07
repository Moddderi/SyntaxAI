import { useCallback, useEffect, useState } from 'react';
import {
  CAPTURE_SETTINGS_CHANGED_EVENT,
  CAPTURE_SETTINGS_STORAGE_KEY,
  getCaptureSettings,
  type CaptureSettings,
} from '../storage/captureSettingsStorage';

interface UseCaptureSettingsResult {
  settings: CaptureSettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCaptureSettings(): UseCaptureSettingsResult {
  const [settings, setSettings] = useState<CaptureSettings>({
    enablePasteCapture: true,
    enableContextCapture: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    const nextSettings = await getCaptureSettings();
    setSettings(nextSettings);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleSettingsChanged = (): void => {
      void refresh();
    };

    window.addEventListener(CAPTURE_SETTINGS_CHANGED_EVENT, handleSettingsChanged);

    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
      return () => {
        window.removeEventListener(CAPTURE_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
      };
    }

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName === 'local' && changes[CAPTURE_SETTINGS_STORAGE_KEY]) {
        void refresh();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      window.removeEventListener(CAPTURE_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [refresh]);

  return { settings, isLoading, refresh };
}
