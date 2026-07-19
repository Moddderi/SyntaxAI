chrome.runtime.onInstalled.addListener(() => {
  console.info('[SyntaxAI] Extension installed');
});

void chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: unknown) => {
    console.error('[SyntaxAI] Failed to configure side panel behavior:', error);
  });

export {};
