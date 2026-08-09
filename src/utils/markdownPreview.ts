const PREVIEW_MAX_LENGTH = 180;

export function stripMarkdownForPreview(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncatePreviewText(text: string, maxLength = PREVIEW_MAX_LENGTH): string {
  const normalized = text.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildPlainTextPreview(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    const stripped = stripMarkdownForPreview(candidate?.trim() ?? '');

    if (stripped) {
      return truncatePreviewText(stripped);
    }
  }

  return '';
}
