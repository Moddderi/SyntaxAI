/** Paths relative to extension root (dist/ or dist-firefox/). */
export const EXTENSION_ICON_PATHS: Record<number, string> = {
  16: 'icons/icon-16.png',
  24: 'icons/icon-24.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
};

export function applyExtensionIcons(): void {
  if (typeof chrome === 'undefined' || !chrome.action?.setIcon) {
    return;
  }

  void chrome.action.setIcon({ path: EXTENSION_ICON_PATHS }).catch((error: unknown) => {
    console.error('[SyntaxAI] Failed to set action icon:', error);
  });
}
