import {
  CONTEXT_CAPTURE_MESSAGE,
  type GetPageContextMessage,
  type GetPageContextResponse,
  type PageContext,
} from '../types/context';
import { getFormattedSelection } from '../utils/selectionFormatter';
import { resolveSiteType } from '../utils/siteType';

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
