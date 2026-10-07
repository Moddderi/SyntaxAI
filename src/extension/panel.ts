interface FirefoxPanelBrowser {
  sidebarAction: {
    open(): Promise<void>;
  };
  action: {
    onClicked: {
      addListener(callback: () => void): void;
    };
  };
}

function getFirefoxPanelBrowser(): FirefoxPanelBrowser | null {
  const root = globalThis as typeof globalThis & { browser?: FirefoxPanelBrowser };

  if (root.browser?.sidebarAction?.open && root.browser.action?.onClicked) {
    return root.browser;
  }

  return null;
}

function getChromeSidePanel(): typeof chrome.sidePanel | null {
  if (typeof chrome === 'undefined' || !chrome.sidePanel?.open) {
    return null;
  }

  return chrome.sidePanel;
}

export async function openCapturePanel(tabId: number): Promise<void> {
  const sidePanel = getChromeSidePanel();

  if (sidePanel) {
    await sidePanel.open({ tabId });
    return;
  }

  const firefox = getFirefoxPanelBrowser();

  if (firefox) {
    await firefox.sidebarAction.open();
  }
}

export function registerCapturePanelBehavior(): void {
  const sidePanel = getChromeSidePanel();

  if (sidePanel?.setPanelBehavior) {
    void sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: unknown) => {
      console.error('[SyntaxAI] Failed to configure side panel behavior:', error);
    });
    return;
  }

  const firefox = getFirefoxPanelBrowser();

  if (!firefox) {
    return;
  }

  firefox.action.onClicked.addListener(() => {
    void firefox.sidebarAction.open().catch((error: unknown) => {
      console.error('[SyntaxAI] Failed to open sidebar:', error);
    });
  });
}

export function isRestrictedExtensionUrl(url: string | undefined): boolean {
  if (!url) {
    return true;
  }

  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('moz-extension://') ||
    url.startsWith('resource://')
  );
}
