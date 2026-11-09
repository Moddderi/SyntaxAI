import {
  CONTEXT_CAPTURE_MESSAGE,
  CONTEXT_MENU_CAPTURE_ID,
  type GetPageContextResponse,
  type PageContext,
} from '../types/context';
import { setPendingContextCapture } from '../storage/contextDraftStorage';
import { isRestrictedExtensionUrl, openCapturePanel } from '../extension/panel';
import { resolveSiteType } from '../utils/siteType';

const CONTEXT_CAPTURE_COMMAND = 'capture-context';

function openSidePanelForTab(tabId: number): void {
  void openCapturePanel(tabId).catch((error: unknown) => {
    console.error('[SyntaxAI] Failed to open capture panel:', error);
  });
}

const PAGE_CAPTURE_SCRIPT = 'content/pageCapture.js';

/**
 * The capture script is injected on demand (shortcut / context menu grant `activeTab`),
 * so the extension never needs blanket access to every website.
 */
async function injectPageCaptureScript(tabId: number): Promise<boolean> {
  if (!chrome.scripting?.executeScript) {
    return false;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [PAGE_CAPTURE_SCRIPT],
    });
    return true;
  } catch (error) {
    console.warn('[SyntaxAI] Could not inject capture script', error);
    return false;
  }
}

async function requestPageContext(tabId: number): Promise<GetPageContextResponse> {
  const injected = await injectPageCaptureScript(tabId);

  if (!injected) {
    return { success: false, pageContext: null };
  }

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

  if (!trimmedSelection || isRestrictedExtensionUrl(pageUrl)) {
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
  if (!tab.id || isRestrictedExtensionUrl(tab.url)) {
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

let menuSetup: Promise<void> = Promise.resolve();

/** Serialized so startup + onInstalled never race into "duplicate menu id" errors. */
export function ensureContextCaptureMenu(): Promise<void> {
  menuSetup = menuSetup
    .then(async () => {
      await chrome.contextMenus.removeAll();

      chrome.contextMenus.create({
        id: CONTEXT_MENU_CAPTURE_ID,
        contexts: ['selection'],
        title: 'Add to SyntaxAI',
      });
    })
    .catch((error: unknown) => {
      console.warn('[SyntaxAI] Context menu setup failed', error);
    });

  return menuSetup;
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
