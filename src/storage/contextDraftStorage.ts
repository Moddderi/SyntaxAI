import type { PageContext, PendingContextCapture } from '../types/context';
import { CONTEXT_CAPTURE_STORAGE_KEY } from '../types/context';

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

export async function setPendingContextCapture(pageContext: PageContext): Promise<void> {
  if (!hasChromeStorage()) {
    return;
  }

  const payload: PendingContextCapture = {
    pageContext,
    capturedAt: Date.now(),
  };

  await chrome.storage.local.set({ [CONTEXT_CAPTURE_STORAGE_KEY]: payload });
}

export async function peekPendingContextCapture(): Promise<PageContext | null> {
  if (!hasChromeStorage()) {
    return null;
  }

  const result = await chrome.storage.local.get(CONTEXT_CAPTURE_STORAGE_KEY);
  const pending = result[CONTEXT_CAPTURE_STORAGE_KEY] as PendingContextCapture | undefined;

  return pending?.pageContext ?? null;
}

export async function consumePendingContextCapture(): Promise<PageContext | null> {
  const pageContext = await peekPendingContextCapture();

  if (!pageContext || !hasChromeStorage()) {
    return null;
  }

  await chrome.storage.local.remove(CONTEXT_CAPTURE_STORAGE_KEY);
  return pageContext;
}
