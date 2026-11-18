import type { Note } from '../types/note';
import { formatTopicLabel } from '../utils/noteHelpers';
import { apiFetchAuthed } from './apiClient';
import { pushDirtyNotesToServer } from './notesSyncService';

export class NoteShareServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoteShareServiceError';
  }
}

interface ShareApiErrorBody {
  error?: string;
}

export interface NoteShareSnapshotPayload {
  title: string;
  summary?: string;
  body?: string;
  code: string;
  primaryTech: string;
  language: string;
  topics: string[];
  sourceUrl?: string;
  sourceType?: Note['sourceType'];
  noteCreatedAt?: string;
}

export interface CreateNoteShareResult {
  url: string;
  slug: string;
  expiresAt: string;
}

export function noteToShareSnapshot(note: Note): NoteShareSnapshotPayload {
  return {
    title: note.title.trim(),
    summary: note.summary?.trim() || undefined,
    body: note.body?.trim() || undefined,
    code: note.code,
    primaryTech: note.primaryTech,
    language: note.language,
    topics: note.topics.map((topic) => formatTopicLabel(topic)).filter((tag) => tag.length > 0),
    sourceUrl: note.sourceUrl?.trim() || undefined,
    sourceType: note.sourceType,
    noteCreatedAt: note.createdAt,
  };
}

export async function createPublicNoteShare(note: Note): Promise<CreateNoteShareResult> {
  await pushDirtyNotesToServer();

  const response = await apiFetchAuthed('/api/v1/notes/share', {
    method: 'POST',
    body: JSON.stringify({
      noteId: note.id,
      snapshot: noteToShareSnapshot(note),
    }),
  });

  if (response.status === 401) {
    throw new NoteShareServiceError('Sign in to SyntaxAI to share notes.');
  }

  let body: ShareApiErrorBody & Partial<CreateNoteShareResult> = {};

  try {
    body = (await response.json()) as ShareApiErrorBody & Partial<CreateNoteShareResult>;
  } catch {
    // ignore parse errors
  }

  if (!response.ok) {
    throw new NoteShareServiceError(
      typeof body.error === 'string' && body.error.trim()
        ? body.error
        : `Failed to create share link (${response.status}).`,
    );
  }

  if (!body.url || !body.slug || !body.expiresAt) {
    throw new NoteShareServiceError('Unexpected share response from server.');
  }

  return {
    url: body.url,
    slug: body.slug,
    expiresAt: body.expiresAt,
  };
}

export async function revokePublicNoteShare(slug: string): Promise<void> {
  const response = await apiFetchAuthed(`/api/v1/notes/share/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });

  if (response.status === 401) {
    throw new NoteShareServiceError('Sign in to SyntaxAI to manage share links.');
  }

  let body: ShareApiErrorBody = {};

  try {
    body = (await response.json()) as ShareApiErrorBody;
  } catch {
    // ignore parse errors
  }

  if (!response.ok) {
    throw new NoteShareServiceError(
      typeof body.error === 'string' && body.error.trim()
        ? body.error
        : `Failed to revoke share link (${response.status}).`,
    );
  }
}