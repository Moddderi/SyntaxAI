import {
  CONTEXT_CAPTURE_MESSAGE,
  type GetPageContextMessage,
  type GetPageContextResponse,
  type PageContext,
} from '../types/context';
import { SYNTAXAI_WEB_ORIGINS } from '../constants/api';
import { RUNTIME_MESSAGE } from '../types/runtimeMessages';
import { getFormattedSelection } from '../utils/selectionFormatter';
import { resolveSiteType } from '../utils/siteType';

function isSyntaxAiWebOrigin(origin: string): boolean {
  return SYNTAXAI_WEB_ORIGINS.includes(origin as (typeof SYNTAXAI_WEB_ORIGINS)[number]);
}

function registerAuthHandoffListener(): void {
  window.addEventListener('message', (event: MessageEvent) => {
    if (!isSyntaxAiWebOrigin(event.origin)) {
      return;
    }

    const data = event.data;

    if (typeof data !== 'object' || data === null) {
      return;
    }

    const record = data as Record<string, unknown>;

    if (record.source !== 'syntaxai-web' || record.type !== 'syntaxai:auth') {
      return;
    }

    if (
      typeof record.token !== 'string' ||
      typeof record.expiresAt !== 'string' ||
      typeof record.userId !== 'string'
    ) {
      return;
    }

    void chrome.runtime.sendMessage({
      type: RUNTIME_MESSAGE.SYNTAXAI_AUTH,
      token: record.token,
      expiresAt: record.expiresAt,
      userId: record.userId,
    });
  });
}

registerAuthHandoffListener();

function getPlainSelectedText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}

function getMetaDescription(): string | undefined {
  const metaElement = document.querySelector('meta[name="description"]');
  const content = metaElement?.getAttribute('content')?.trim();

  return content || undefined;
}

function collectPageContext(): PageContext | null {
  const rawContent = getFormattedSelection();
  const selectedText = getPlainSelectedText() || rawContent;

  if (!selectedText) {
    return null;
  }

  return {
    selectedText,
    rawContent: rawContent || selectedText,
    url: window.location.href,
    pageTitle: document.title.trim() || window.location.href,
    metaDescription: getMetaDescription(),
    siteType: resolveSiteType(window.location.href),
    timestamp: Date.now(),
  };
}

chrome.runtime.onMessage.addListener(
  (
    message: GetPageContextMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: GetPageContextResponse) => void,
  ): boolean => {
    if (message.type !== CONTEXT_CAPTURE_MESSAGE.GET_PAGE_CONTEXT) {
      return false;
    }

    const pageContext = collectPageContext();

    sendResponse({
      success: pageContext !== null,
      pageContext,
    });

    return true;
  },
);

export {};
