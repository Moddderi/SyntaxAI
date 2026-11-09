import { describe, expect, it } from 'vitest';
import {
  buildSyncPushBatch,
  noteToSyncPayload,
  serverNoteToLocalNote,
  shouldApplyServerNote,
} from '../notesSyncMapper';
import type { SyncNotePullRecord } from '../../types/api';
import type { Note } from '../../types/note';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    title: 'Counter',
    code: 'const n = 1;',
    primaryTech: 'react',
    language: 'javascript',
    topics: ['hooks'],
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    isStarred: false,
    ...overrides,
  };
}

function makeServerRecord(overrides: Partial<SyncNotePullRecord> = {}): SyncNotePullRecord {
  return {
    id: 'note-1',
    title: 'Counter',
    content: 'const n = 1;',
    tags: ['Hooks'],
    pageUrl: null,
    stack: ['react', 'javascript'],
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('noteToSyncPayload', () => {
  it('maps core fields and keeps the id within the server limit', () => {
    const payload = noteToSyncPayload(makeNote({ id: 'x'.repeat(90) }));

    expect(payload.id).toHaveLength(64);
    expect(payload.title).toBe('Counter');
    expect(payload.deleted).toBe(false);
    expect(payload.updatedAt).toBe('2026-11-01T10:00:00.000Z');
  });

  it('joins summary, body and code into content', () => {
    const payload = noteToSyncPayload(
      makeNote({ summary: 'A counter.', body: 'Longer notes.', code: 'let a = 1;' }),
    );

    expect(payload.content).toBe('A counter.\n\nLonger notes.\n\nlet a = 1;');
  });

  it('sends null pageUrl when the note has no source and flags soft deletes', () => {
    const payload = noteToSyncPayload(makeNote({ sourceUrl: '   ', isDeleted: true }));

    expect(payload.pageUrl).toBeNull();
    expect(payload.deleted).toBe(true);
  });

  it('deduplicates the stack when tech and language match', () => {
    const payload = noteToSyncPayload(makeNote({ primaryTech: 'python', language: 'python' }));

    expect(payload.stack).toEqual(['python']);
  });

  it('falls back to createdAt when updatedAt is missing', () => {
    const payload = noteToSyncPayload(makeNote({ updatedAt: undefined }));

    expect(payload.updatedAt).toBe('2026-11-01T10:00:00.000Z');
  });
});

describe('buildSyncPushBatch', () => {
  it('includes only dirty notes', () => {
    const notes = [makeNote({ id: 'a' }), makeNote({ id: 'b' }), makeNote({ id: 'c' })];

    const batch = buildSyncPushBatch(notes, ['a', 'c']);

    expect(batch.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('caps a push at 200 notes (server limit)', () => {
    const notes = Array.from({ length: 250 }, (_, index) => makeNote({ id: `n-${index}` }));
    const dirty = notes.map((note) => note.id);

    expect(buildSyncPushBatch(notes, dirty)).toHaveLength(200);
  });
});

describe('shouldApplyServerNote (last-write-wins)', () => {
  const local = makeNote({ updatedAt: '2026-11-01T10:00:00.000Z' });

  it('applies a note that does not exist locally', () => {
    expect(shouldApplyServerNote(undefined, '2026-11-01T09:00:00.000Z', null)).toBe(true);
  });

  it('applies a strictly newer server note', () => {
    expect(shouldApplyServerNote(local, '2026-11-01T10:00:01.000Z', null)).toBe(true);
  });

  it('keeps the local note when the server copy is older', () => {
    expect(shouldApplyServerNote(local, '2026-11-01T09:59:59.000Z', null)).toBe(false);
  });

  it('does not re-apply an identical timestamp', () => {
    expect(shouldApplyServerNote(local, '2026-11-01T10:00:00.000Z', null)).toBe(false);
  });

  it('applies a delete tombstone at the same timestamp', () => {
    expect(
      shouldApplyServerNote(local, '2026-11-01T10:00:00.000Z', '2026-11-01T10:00:00.000Z'),
    ).toBe(true);
  });

  it('ignores an older tombstone so a newer local edit survives', () => {
    expect(
      shouldApplyServerNote(local, '2026-11-01T09:00:00.000Z', '2026-11-01T09:00:00.000Z'),
    ).toBe(false);
  });
});

describe('serverNoteToLocalNote', () => {
  it('restores a note from the server with sensible defaults', () => {
    const note = serverNoteToLocalNote(makeServerRecord({ pageUrl: 'https://react.dev' }), null);

    expect(note.id).toBe('note-1');
    expect(note.primaryTech).toBe('react');
    expect(note.isStarred).toBe(false);
    expect(note.isDeleted).toBe(false);
    expect(note.sourceUrl).toBe('https://react.dev');
  });

  it('preserves local-only fields (starred, code) when merging an update', () => {
    const existing = makeNote({ isStarred: true, code: 'LOCAL CODE', summary: 'kept' });

    const merged = serverNoteToLocalNote(
      makeServerRecord({ title: 'Renamed', content: 'server blob' }),
      existing,
    );

    expect(merged.title).toBe('Renamed');
    expect(merged.isStarred).toBe(true);
    expect(merged.code).toBe('LOCAL CODE');
    expect(merged.summary).toBe('kept');
  });

  it('marks tombstoned records as deleted', () => {
    const merged = serverNoteToLocalNote(
      makeServerRecord({ deletedAt: '2026-11-02T10:00:00.000Z' }),
      makeNote(),
    );

    expect(merged.isDeleted).toBe(true);
  });
});
