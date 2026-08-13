import { getNotes } from '../types/note';

function buildExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `syntaxai-notes-${date}.json`;
}

export async function exportNotesToJsonFile(): Promise<number> {
  const notes = await getNotes();
  const payload = JSON.stringify(notes, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = buildExportFilename();
  anchor.click();

  URL.revokeObjectURL(url);
  return notes.length;
}
