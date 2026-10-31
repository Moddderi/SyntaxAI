export interface SyntaxAiSessionUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

export interface SyntaxAiSessionResponse {
  user: SyntaxAiSessionUser;
  billing: {
    enabled: boolean;
    limits: unknown;
  };
  sync: {
    notesPath: string;
    strategy: string;
  };
}

export interface SyncNotePushPayload {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pageUrl: string | null;
  stack: string[] | null;
  updatedAt: string;
  deleted: boolean;
}

export interface SyncNotePullRecord {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pageUrl: string | null;
  stack: string[] | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PushNotesResponse {
  ok: boolean;
  applied: number;
  skipped: number;
  serverTime: string;
}

export interface PullNotesResponse {
  notes: SyncNotePullRecord[];
  serverTime: string;
}
