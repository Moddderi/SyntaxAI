import { useCallback, useEffect, useRef } from 'react';
import { consumePendingContextCapture } from '../../storage/contextDraftStorage';
import { CONTEXT_CAPTURE_STORAGE_KEY } from '../../types/context';
import type { PageContext } from '../../types/context';

interface UseContextCaptureDraftOptions {
  onCapture: (pageContext: PageContext) => void;
}

export function useContextCaptureDraft({
  onCapture,
}: UseContextCaptureDraftOptions): { consumeDraft: () => Promise<void> } {
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  const consumeDraft = useCallback(async (): Promise<void> => {
    const pageContext = await consumePendingContextCapture();

    if (pageContext) {
      onCaptureRef.current(pageContext);
    }
  }, []);

  useEffect(() => {
    void consumeDraft();

    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
      return;
    }

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== 'local' || !changes[CONTEXT_CAPTURE_STORAGE_KEY]?.newValue) {
        return;
      }

      void consumeDraft();
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [consumeDraft]);

  return { consumeDraft };
}
