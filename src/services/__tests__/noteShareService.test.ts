import { describe, expect, it } from 'vitest';
import { noteToShareSnapshot } from '../noteShareService';
import type { Note } from '../../types/note';

const baseNote: Note = {
  id: 'note-1',
  title: '  Hello  ',
  code: 'const x = 1;',
  primaryTech: 'typescript',
  language: 'typescript',
  topics: ['#hooks', 'react'],
  summary: ' short ',
  body: ' body ',
  sourceUrl: 'https://example.com',
  createdAt: '2026-11-01T10:00:00.000Z',
  isStarred: false,
  sourceType: 'code',
};

describe('noteToShareSnapshot', () => {
  it('trims text fields and normalizes topics', () => {
    const snapshot = noteToShareSnapshot(baseNote);

    expect(snapshot.title).toBe('Hello');
    expect(snapshot.summary).toBe('short');
    expect(snapshot.body).toBe('body');
    expect(snapshot.topics).toEqual(['hooks', 'react']);
    expect(snapshot.noteCreatedAt).toBe(baseNote.createdAt);
  });
});