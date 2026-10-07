import { useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getCodePreviewLines, getCodeBlockLanguageLabel, resolvePrismLanguage } from '../utils/codeLanguage';

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
  showLanguageLabel?: boolean;
  showCopy?: boolean;
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
  showLanguageLabel = false,
  showCopy = false,
}: CodeBlockProps): ReactElement {
  const [isCopied, setIsCopied] = useState(false);
  const highlighterLanguage = useMemo(
    () => resolvePrismLanguage(language),
    [language],
  );

  const languageLabel = useMemo(
    () => getCodeBlockLanguageLabel(language),
    [language],
  );

  const displayCode = useMemo(
    () => (maxLines ? getCodePreviewLines(code, maxLines) : code),
    [code, maxLines],
  );

  const fontSize = FONT_SIZES[size];
  const lineHeight = size === 'md' ? 1.55 : 1.5;

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1200);
    });
  };

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border border-syntax-border bg-syntax-code ${className}`.trim()}
      style={
        maxLines
          ? {
              maxHeight: showLanguageLabel
                ? `${maxLines * lineHeight * parseFloat(fontSize) + 40}px`
                : `${maxLines * lineHeight * parseFloat(fontSize) + 16}px`,
            }
          : undefined
      }
    >
      {showLanguageLabel || showCopy ? (
        <div className="flex items-center justify-between gap-2 border-b border-syntax-border bg-syntax-code-header px-3 py-1.5">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-syntax-muted">
            {showLanguageLabel ? languageLabel : ''}
          </span>
          {showCopy ? (
            <button
              aria-label={isCopied ? 'Copied' : 'Copy code'}
              className="flex h-6 w-6 items-center justify-center rounded-md text-syntax-muted transition hover:bg-syntax-inset hover:text-syntax-accent"
              onClick={handleCopy}
              type="button"
            >
              {isCopied ? (
                <span className="text-[10px] font-semibold text-syntax-accent">✓</span>
              ) : (
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <rect height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="10" x="9" y="9" />
                  <path d="M7 15H6.5A1.5 1.5 0 0 1 5 13.5v-8A1.5 1.5 0 0 1 6.5 4h8A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="max-w-full overflow-x-auto overscroll-x-contain px-3 py-2 [scrollbar-width:thin]">
        <SyntaxHighlighter
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize,
              lineHeight: String(lineHeight),
              whiteSpace: 'pre',
              userSelect: 'text',
            },
          }}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            overflow: 'visible',
            minWidth: 'min-content',
          }}
          language={highlighterLanguage}
          PreTag="div"
          style={CODE_BLOCK_THEME}
          wrapLongLines={false}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
