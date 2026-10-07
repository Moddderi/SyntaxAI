import { registerCapturePanelBehavior } from '../extension/panel';
import {
  ensureContextCaptureMenu,
  registerContextCaptureListeners,
} from './contextCapture';

chrome.runtime.onInstalled.addListener(() => {
  console.info('[SyntaxAI] Extension installed');
  void ensureContextCaptureMenu();
});

void ensureContextCaptureMenu();

registerCapturePanelBehavior();

registerContextCaptureListeners();

export {};
