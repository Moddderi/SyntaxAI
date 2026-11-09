import {
  pushDirtyNotesToServer,
  runNotesSyncCycle,
} from '../services/notesSyncService';
import { RUNTIME_MESSAGE, type SyntaxAiRuntimeMessage } from '../types/runtimeMessages';

const SYNC_ALARM_NAME = 'syntaxai-notes-sync';
const SYNC_INTERVAL_MINUTES = 5;

let flushChain: Promise<void> = Promise.resolve();

function enqueueSync(task: () => Promise<void>): void {
  flushChain = flushChain
    .then(task)
    .catch((error) => {
      console.warn('[SyntaxAI] Notes sync failed', error);
    });
}

export function registerSyncMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message: SyntaxAiRuntimeMessage): boolean => {
    if (message.type === RUNTIME_MESSAGE.SYNTAXAI_SYNC_FLUSH) {
      // Local-first: push dirties only. Pull runs on alarm / explicit pull.
      enqueueSync(() => pushDirtyNotesToServer());
      return false;
    }

    if (message.type === RUNTIME_MESSAGE.SYNTAXAI_SYNC_PULL) {
      enqueueSync(() => runNotesSyncCycle());
      return false;
    }

    return false;
  });
}

export function startSyncAlarms(): void {
  if (!chrome.alarms?.create) {
    return;
  }

  void chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: SYNC_INTERVAL_MINUTES,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SYNC_ALARM_NAME) {
      enqueueSync(() => runNotesSyncCycle());
    }
  });
}

export function runBackgroundNotesSync(): Promise<void> {
  const next = flushChain.then(() => runNotesSyncCycle());
  flushChain = next.catch((error) => {
    console.warn('[SyntaxAI] Notes sync failed', error);
  });
  return next;
}
