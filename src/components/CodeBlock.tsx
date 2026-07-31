import { useMemo, type CSSProperties, type ReactElement } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getCodePreviewLines, resolvePrismLanguage } from '../utils/codeLanguage';

const CODE_BLOCK_THEME: Record<string, CSSProperties> = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...(vscDarkPlus['pre[class*="language-"]'] as CSSProperties | undefined),
    background: 'transparent',
    margin: 0,
    padding: 0,
    border: 0,
    boxShadow: 'none',
  },
  'code[class*="language-"]': {
    ...(vscDarkPlus['code[class*="language-"]'] as CSSProperties | undefined),
    background: 'transparent',
    padding: 0,
    textShadow: 'none',
  },
};

interface CodeBlockProps {
  code: string;
  language?: string;
  maxLines?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const FONT_SIZES: Record<'sm' | 'md', string> = {
  sm: '11px',
  md: '13px',
};

export function CodeBlock({
  code,
  language,
  maxLines,
  size = 'sm',
  className = '',
}: CodeBlockProps): ReactElement {
  const highlighterLanguage = useMemo(
    () => resolvePrismLanguage(language),
    [language],
  );

  const displayCode = useMemo(
    () => (maxLines ? getCodePreviewLines(code, maxLines) : code),
    [code, maxLines],
  );

  const fontSize = FONT_SIZES[size];
  const lineHeight = size === 'md' ? 1.55 : 1.5;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#1c1c20] bg-[#1a1b1e] px-3 py-2 ${className}`.trim()}
      style={
        maxLines
          ? {
              maxHeight: `${maxLines * lineHeight * parseFloat(fontSize) + 16}px`,
            }
          : undefined
      }
    >
      <SyntaxHighlighter
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize,
            lineHeight: String(lineHeight),
          },
        }}
        customStyle={{
          margin: 0,
          padding: 0,
          background: 'transparent',
          overflow: 'hidden',
        }}
        language={highlighterLanguage}
        PreTag="div"
        style={CODE_BLOCK_THEME}
        wrapLongLines={false}
      >
        {displayCode}
      </SyntaxHighlighter>
    </div>
  );
}
