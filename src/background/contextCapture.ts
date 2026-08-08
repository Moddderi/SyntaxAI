import {
  CONTEXT_CAPTURE_MESSAGE,
  CONTEXT_MENU_CAPTURE_ID,
  type GetPageContextResponse,
  type PageContext,
} from '../types/context';
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

async function captureAndOpenSidePanel(
  pageContext: PageContext,
  tabId: number,
): Promise<void> {
  await setPendingContextCapture(pageContext);

  try {
    await chrome.sidePanel.open({ tabId });
  } catch (error: unknown) {
    console.error('[SyntaxAI] Failed to open side panel:', error);
  }
}

export async function handleContextCaptureCommand(): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab?.id) {
    return;
  }

  const pageContext = await resolvePageContextFromTab(activeTab);

  if (!pageContext) {
    console.warn('[SyntaxAI] Select code or text on the page before capturing context.');
    return;
  }

  await captureAndOpenSidePanel(pageContext, activeTab.id);
}

async function handleContextMenuCapture(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
): Promise<void> {
  if (!tab?.id) {
    return;
  }

  const pageContext = await resolvePageContextFromTab(tab, info.selectionText?.trim());

  if (!pageContext) {
    console.warn('[SyntaxAI] Context capture is unavailable on this page.');
    return;
  }

  await captureAndOpenSidePanel(pageContext, tab.id);
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

    void handleContextCaptureCommand();
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_CAPTURE_ID) {
      return;
    }

    void handleContextMenuCapture(info, tab);
  });
}
