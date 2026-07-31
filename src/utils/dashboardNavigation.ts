export const OPEN_SETTINGS_STORAGE_KEY = 'syntaxai_open_settings';

function isChromeRuntimeAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.openOptionsPage);
}

export function openDashboard(): void {
  if (isChromeRuntimeAvailable()) {
    void chrome.runtime.openOptionsPage();
    return;
  }

  window.open('/src/dashboard/index.html', '_blank');
}

export async function openDashboardSettings(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [OPEN_SETTINGS_STORAGE_KEY]: true });
    void chrome.runtime.openOptionsPage();
    return;
  }

  window.open('/src/dashboard/index.html#settings', '_blank');
}

export async function consumeOpenSettingsIntent(): Promise<boolean> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await chrome.storage.local.get(OPEN_SETTINGS_STORAGE_KEY);

    if (result[OPEN_SETTINGS_STORAGE_KEY] === true) {
      await chrome.storage.local.remove(OPEN_SETTINGS_STORAGE_KEY);
      return true;
    }

    return false;
  }

  if (window.location.hash === '#settings') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }

  return false;
}
