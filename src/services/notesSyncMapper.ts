import { formatTopicLabel } from '../utils/noteHelpers';
import { resolveDeviconSlug } from '../utils/techIcon';
import type { Note } from '../types/note';
import type { SyncNotePullRecord, SyncNotePushPayload } from '../types/api';

const MAX_NOTES_PER_PUSH = 200;

function noteUpdatedAt(note: Note): string {
  return note.updatedAt ?? note.createdAt;
}

function buildNoteContent(note: Note): string {
  const parts: string[] = [];

  if (note.summary?.trim()) {
    parts.push(note.summary.trim());
  }

  if (note.body?.trim()) {
    parts.push(note.body.trim());
  }

  if (note.code.trim()) {
    parts.push(note.code.trim());
  }

  return parts.join('\n\n');
}

function buildNoteStack(note: Note): string[] | null {
  const primary = resolveDeviconSlug(note.primaryTech);
  const language = resolveDeviconSlug(note.language);
  const stack = [primary, language].filter((slug, index, array) => array.indexOf(slug) === index);

  if (stack.length === 0) {
    return null;
  }

  return stack;
}

export function noteToSyncPayload(note: Note): SyncNotePushPayload {
  return {
    id: note.id.slice(0, 64),
    title: note.title,
    content: buildNoteContent(note),
    tags: note.topics.map((topic) => formatTopicLabel(topic)).filter((tag) => tag.length > 0),
    pageUrl: note.sourceUrl?.trim() ? note.sourceUrl.trim() : null,
    stack: buildNoteStack(note),
    updatedAt: noteUpdatedAt(note),
    deleted: note.isDeleted === true,
  };
}

export function buildSyncPushBatch(notes: Note[], dirtyIds: string[]): SyncNotePushPayload[] {
  const dirtySet = new Set(dirtyIds);
  const payloads = notes
    .filter((note) => dirtySet.has(note.id))
    .map((note) => noteToSyncPayload(note));

  return payloads.slice(0, MAX_NOTES_PER_PUSH);
}

function inferPrimaryTechFromStack(stack: string[] | null): string {
  if (!stack || stack.length === 0) {
    return 'javascript';
  }

  return resolveDeviconSlug(stack[0]);
}

function inferLanguageFromStack(stack: string[] | null, content: string): string {
  if (stack && stack.length > 1) {
    return resolveDeviconSlug(stack[1]);
  }

  const firstLine = content.split('\n').find((line) => line.trim().length > 0) ?? '';

  if (firstLine.includes('import ') || firstLine.includes('export ')) {
    return 'typescript';
  }

  return 'javascript';
}

export function serverNoteToLocalNote(record: SyncNotePullRecord, existing: Note | null): Note {
  const deleted = record.deletedAt !== null;
  const content = record.content.trim();
  const primaryTech = existing?.primaryTech ?? inferPrimaryTechFromStack(record.stack);
  const language =
    existing?.language ?? inferLanguageFromStack(record.stack, content);

  return {
    id: record.id,
    title: record.title,
    code: existing?.code ?? content,
    primaryTech,
    language,
    topics:
      record.tags.length > 0
        ? record.tags.map((tag) => formatTopicLabel(tag)).filter((tag) => tag.length > 0)
        : (existing?.topics ?? []),
    summary: existing?.summary,
    body: existing?.body,
    sourceUrl: record.pageUrl?.trim() || existing?.sourceUrl,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isStarred: existing?.isStarred ?? false,
    isDeleted: deleted,
    sourceType: existing?.sourceType ?? 'code',
  };
}

export function shouldApplyServerNote(
  local: Note | undefined,
  serverUpdatedAt: string,
  serverDeletedAt: string | null,
): boolean {
  if (!local) {
    return true;
  }

  const localUpdated = new Date(noteUpdatedAt(local)).getTime();
  const serverUpdated = new Date(serverUpdatedAt).getTime();

  if (serverDeletedAt) {
    return serverUpdated >= localUpdated;
  }

  return serverUpdated > localUpdated;
}
