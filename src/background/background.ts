import { registerCapturePanelBehavior } from '../extension/panel';
import {
  ensureContextCaptureMenu,
  registerContextCaptureListeners,
} from './contextCapture';
import { registerAuthMessageHandlers, runStartupAuthAndSync } from './authCoordinator';
import { registerSyncMessageHandlers, startSyncAlarms } from './syncCoordinator';

chrome.runtime.onInstalled.addListener(() => {
  console.info('[SyntaxAI] Extension installed');
  void ensureContextCaptureMenu();
});

void ensureContextCaptureMenu();

registerCapturePanelBehavior();

registerContextCaptureListeners();

registerAuthMessageHandlers();
registerSyncMessageHandlers();
startSyncAlarms();

void runStartupAuthAndSync();
