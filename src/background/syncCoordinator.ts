import { runNotesSyncCycle } from '../services/notesSyncService';
import { RUNTIME_MESSAGE, type SyntaxAiRuntimeMessage } from '../types/runtimeMessages';

const SYNC_ALARM_NAME = 'syntaxai-notes-sync';
const SYNC_INTERVAL_MINUTES = 5;

let flushInFlight: Promise<void> | null = null;

async function flushSyncSafely(): Promise<void> {
  if (flushInFlight) {
    await flushInFlight;
    return;
  }

  flushInFlight = runNotesSyncCycle()
    .catch((error) => {
      console.warn('[SyntaxAI] Notes sync failed', error);
    })
    .finally(() => {
      flushInFlight = null;
    });

  await flushInFlight;
}

export function registerSyncMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message: SyntaxAiRuntimeMessage): boolean => {
    if (
      message.type === RUNTIME_MESSAGE.SYNTAXAI_SYNC_FLUSH ||
      message.type === RUNTIME_MESSAGE.SYNTAXAI_SYNC_PULL
    ) {
      void flushSyncSafely();
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
      void flushSyncSafely();
    }
  });
}

export { flushSyncSafely as runBackgroundNotesSync };
