const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'dd',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'td',
  'th',
  'tr',
  'ul',
]);

function collapseBlankLines(value: string): string {
  return value.replace(/\n{3,}/g, '\n\n').trim();
}

function isCodeContainer(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase();

  if (tag === 'pre' || tag === 'code') {
    return true;
  }

  return element.closest('pre') !== null || element.closest('code') !== null;
}

function formatInlineElement(element: HTMLElement, text: string): string {
  const tag = element.tagName.toLowerCase();

  if (tag === 'strong' || tag === 'b') {
    return `**${text}**`;
  }

  if (tag === 'em' || tag === 'i') {
    return `*${text}*`;
  }

  if (tag === 'code' && element.closest('pre') === null) {
    return `\`${text}\``;
  }

  if (tag === 'a') {
    const href = element.getAttribute('href')?.trim();

    if (href && text) {
      return `[${text}](${href})`;
    }
  }

  return text;
}

function formatListItem(element: HTMLElement, ordered: boolean, index: number): string {
  const prefix = ordered ? `${index + 1}. ` : '- ';
  const content = formatNode(element).trim();

  if (!content) {
    return '';
  }

  return `${prefix}${content.replace(/\n+/g, ' ')}\n`;
}

function formatNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();

  if (tag === 'br') {
    return '\n';
  }

  if (isCodeContainer(element) && tag === 'pre') {
    const codeText = element.textContent?.replace(/\n$/, '') ?? '';

    if (!codeText.trim()) {
      return '';
    }

    const languageClass = element.querySelector('code')?.className ?? '';
    const languageMatch = languageClass.match(/language-([\w-]+)/i);
    const languageHint = languageMatch?.[1] ?? '';

    return `\`\`\`${languageHint}\n${codeText}\n\`\`\`\n\n`;
  }

  if (tag === 'code' && element.closest('pre') !== null) {
    return element.textContent ?? '';
  }

  const childContent = Array.from(element.childNodes).map(formatNode).join('');
  const trimmedContent = childContent.trim();

  switch (tag) {
    case 'h1':
      return `# ${trimmedContent}\n\n`;
    case 'h2':
      return `## ${trimmedContent}\n\n`;
    case 'h3':
      return `### ${trimmedContent}\n\n`;
    case 'h4':
      return `#### ${trimmedContent}\n\n`;
    case 'h5':
      return `##### ${trimmedContent}\n\n`;
    case 'h6':
      return `###### ${trimmedContent}\n\n`;
    case 'p':
    case 'div':
    case 'section':
    case 'article':
      return trimmedContent ? `${trimmedContent}\n\n` : '';
    case 'blockquote':
      return trimmedContent
        .split('\n')
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join('\n')
        .concat('\n\n');
    case 'hr':
      return '---\n\n';
    case 'ul':
      return Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((child, index) => formatListItem(child as HTMLElement, false, index))
        .join('');
    case 'ol':
      return Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((child, index) => formatListItem(child as HTMLElement, true, index))
        .join('');
    case 'li':
      return `${trimmedContent}\n`;
    case 'table':
      return `${trimmedContent}\n\n`;
    case 'tr': {
      const cells = Array.from(element.children)
        .map((cell) => formatNode(cell).trim())
        .filter(Boolean);

      return cells.length > 0 ? `| ${cells.join(' | ')} |\n` : '';
    }
    default:
      return formatInlineElement(element, childContent);
  }
}

function formatFragment(fragment: DocumentFragment): string {
  const container = document.createElement('div');
  container.appendChild(fragment.cloneNode(true));

  const blocks = Array.from(container.childNodes).map((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (BLOCK_TAGS.has(tag) || tag === 'pre' || tag === 'code') {
        return formatNode(node);
      }
    }

    const inline = formatNode(node).trim();
    return inline ? `${inline}\n\n` : '';
  });

  return collapseBlankLines(blocks.join(''));
}

export function getFormattedSelection(): string {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return '';
  }

  const parts: string[] = [];

  for (let index = 0; index < selection.rangeCount; index += 1) {
    const range = selection.getRangeAt(index);
    const fragment = range.cloneContents();
    const formatted = formatFragment(fragment);

    if (formatted) {
      parts.push(formatted);
    }
  }

  const merged = collapseBlankLines(parts.join('\n\n'));

  if (merged) {
    return merged;
  }

  return selection.toString().trim();
}

export function extractPrimaryCodeFromMarkdown(markdown: string): string {
  const fencedBlocks = [...markdown.matchAll(/```[\w-]*\n([\s\S]*?)```/g)];

  if (fencedBlocks.length === 0) {
    return '';
  }

  return fencedBlocks
    .map((match) => match[1]?.trim() ?? '')
    .sort((left, right) => right.length - left.length)[0] ?? '';
}
