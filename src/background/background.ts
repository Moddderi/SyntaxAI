import {
  ensureContextCaptureMenu,
  registerContextCaptureListeners,
} from './contextCapture';

chrome.runtime.onInstalled.addListener(() => {
  console.info('[SyntaxAI] Extension installed');
  void ensureContextCaptureMenu();
});

void ensureContextCaptureMenu();

void chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: unknown) => {
    console.error('[SyntaxAI] Failed to configure side panel behavior:', error);
  });

registerContextCaptureListeners();

export {};
