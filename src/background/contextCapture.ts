import {
  CONTEXT_CAPTURE_MESSAGE,
  CONTEXT_MENU_CAPTURE_ID,
  type GetPageContextResponse,
  type PageContext,
} from '../types/context';
import { isContextCaptureEnabled } from '../storage/captureSettingsStorage';
import { setPendingContextCapture } from '../storage/contextDraftStorage';
import { resolveSiteType } from '../utils/siteType';

const CONTEXT_CAPTURE_COMMAND = 'capture-context';

function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) {
    return true;
  }

  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:')
  );
}

function openSidePanelForTab(tabId: number): void {
  void chrome.sidePanel.open({ tabId }).catch((error: unknown) => {
    console.error('[SyntaxAI] Failed to open side panel:', error);
  });
}

async function requestPageContext(tabId: number): Promise<GetPageContextResponse> {
  try {
    return await chrome.tabs.sendMessage(tabId, {
      type: CONTEXT_CAPTURE_MESSAGE.GET_PAGE_CONTEXT,
    });
  } catch {
    return { success: false, pageContext: null };
  }
}

function buildFallbackPageContext(
  selectedText: string,
  tab: chrome.tabs.Tab,
): PageContext | null {
  const trimmedSelection = selectedText.trim();
  const pageUrl = tab.url ?? '';

  if (!trimmedSelection || isRestrictedUrl(pageUrl)) {
    return null;
  }

  return {
    selectedText: trimmedSelection,
    rawContent: trimmedSelection,
    url: pageUrl,
    pageTitle: tab.title?.trim() || pageUrl,
    siteType: resolveSiteType(pageUrl),
    timestamp: Date.now(),
  };
}

function mergePageContextWithFallback(
  pageContext: PageContext,
  fallbackSelection: string | undefined,
  tab: chrome.tabs.Tab,
): PageContext {
  const trimmedFallback = fallbackSelection?.trim() ?? '';

  if (!trimmedFallback) {
    return pageContext;
  }

  const hasCapturedContent =
    pageContext.rawContent.trim().length > 0 || pageContext.selectedText.trim().length > 0;

  if (!hasCapturedContent) {
    return buildFallbackPageContext(trimmedFallback, tab) ?? pageContext;
  }

  if (pageContext.rawContent.trim().length >= trimmedFallback.length) {
    return pageContext;
  }

  return {
    ...pageContext,
    rawContent: pageContext.rawContent.trim() || trimmedFallback,
    selectedText: pageContext.selectedText.trim() || trimmedFallback,
  };
}

async function resolvePageContextFromTab(
  tab: chrome.tabs.Tab,
  fallbackSelection?: string,
): Promise<PageContext | null> {
  if (!tab.id || isRestrictedUrl(tab.url)) {
    return null;
  }

  const trimmedFallback = fallbackSelection?.trim();
  const response = await requestPageContext(tab.id);

  if (response.pageContext) {
    return mergePageContextWithFallback(response.pageContext, trimmedFallback, tab);
  }

  if (trimmedFallback) {
    return buildFallbackPageContext(trimmedFallback, tab);
  }

  return null;
}

async function finishContextCapture(
  tab: chrome.tabs.Tab,
  fallbackSelection?: string,
): Promise<void> {
  const contextEnabled = await isContextCaptureEnabled();

  if (!contextEnabled) {
    console.warn('[SyntaxAI] Context capture is disabled in settings.');
    return;
  }

  const pageContext = await resolvePageContextFromTab(tab, fallbackSelection);

  if (!pageContext) {
    console.warn('[SyntaxAI] Context capture is unavailable on this page.');
    return;
  }

  await setPendingContextCapture(pageContext);
}

function startContextCapture(tab: chrome.tabs.Tab, fallbackSelection?: string): void {
  if (!tab.id) {
    return;
  }

  openSidePanelForTab(tab.id);
  void finishContextCapture(tab, fallbackSelection);
}

export function handleContextCaptureCommand(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    if (!activeTab) {
      return;
    }

    startContextCapture(activeTab);
  });
}

function handleContextMenuCapture(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
): void {
  if (!tab?.id) {
    return;
  }

  startContextCapture(tab, info.selectionText?.trim());
}

export async function ensureContextCaptureMenu(): Promise<void> {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: CONTEXT_MENU_CAPTURE_ID,
    contexts: ['selection'],
    title: 'Add to SyntaxAI',
  });
}

export function registerContextCaptureListeners(): void {
  chrome.commands.onCommand.addListener((command) => {
    if (command !== CONTEXT_CAPTURE_COMMAND) {
      return;
    }

    handleContextCaptureCommand();
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_CAPTURE_ID) {
      return;
    }

    handleContextMenuCapture(info, tab);
  });
}
