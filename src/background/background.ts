import { registerCapturePanelBehavior } from '../extension/panel';
import {
  ensureContextCaptureMenu,
  registerContextCaptureListeners,
} from './contextCapture';
import { registerAuthMessageHandlers, runStartupAuthAndSync } from './authCoordinator';
import { registerAuthTabWatcher } from './authTabWatcher';
import { registerSyncMessageHandlers, startSyncAlarms } from './syncCoordinator';
import { hasAuthCredentials } from '../storage/authStorage';
import { openAuthPage } from '../utils/openAuthPage';

chrome.runtime.onInstalled.addListener((details) => {
  void ensureContextCaptureMenu();

  // First install only (not updates): guide the user straight to sign-in.
  if (details.reason !== 'install') {
    return;
  }

  void hasAuthCredentials().then((signedIn) => {
    if (!signedIn) {
      openAuthPage();
    }
  });
});

void ensureContextCaptureMenu();

registerCapturePanelBehavior();

registerContextCaptureListeners();

registerAuthMessageHandlers();
registerAuthTabWatcher();
registerSyncMessageHandlers();
startSyncAlarms();

void runStartupAuthAndSync();
