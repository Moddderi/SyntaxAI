export const RUNTIME_MESSAGE = {
  SYNTAXAI_AUTH: 'SYNTAXAI_AUTH',
  SYNTAXAI_REFRESH_SESSION: 'SYNTAXAI_REFRESH_SESSION',
  SYNTAXAI_SYNC_FLUSH: 'SYNTAXAI_SYNC_FLUSH',
  SYNTAXAI_SYNC_PULL: 'SYNTAXAI_SYNC_PULL',
} as const;

export interface SyntaxAiAuthMessage {
  type: typeof RUNTIME_MESSAGE.SYNTAXAI_AUTH;
  token: string;
  expiresAt: string;
  userId: string;
}

export interface SyntaxAiRefreshSessionMessage {
  type: typeof RUNTIME_MESSAGE.SYNTAXAI_REFRESH_SESSION;
}

export interface SyntaxAiSyncFlushMessage {
  type: typeof RUNTIME_MESSAGE.SYNTAXAI_SYNC_FLUSH;
}

export interface SyntaxAiSyncPullMessage {
  type: typeof RUNTIME_MESSAGE.SYNTAXAI_SYNC_PULL;
}

export type SyntaxAiRuntimeMessage =
  | SyntaxAiAuthMessage
  | SyntaxAiRefreshSessionMessage
  | SyntaxAiSyncFlushMessage
  | SyntaxAiSyncPullMessage;

export interface SyntaxAiAuthResultResponse {
  ok: boolean;
  signedIn: boolean;
  error?: string;
}
