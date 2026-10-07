import type { ReactElement } from 'react';
import { getCodeBlockLanguageLabel } from '../utils/codeLanguage';

interface CodeEditorFieldProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
}

export function CodeEditorField({
  code,
  language,
  onChange,
  placeholder = 'Primary code snippet…',
  minHeightClass = 'min-h-[180px]',
}: CodeEditorFieldProps): ReactElement {
  const languageLabel = getCodeBlockLanguageLabel(language);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-syntax-border bg-syntax-code">
      <div className="flex items-center border-b border-syntax-border bg-syntax-card px-3 py-1.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-syntax-muted">
          {languageLabel}
        </span>
      </div>

      <div className="max-w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
        <textarea
          aria-label="Code block"
          className={`${minHeightClass} block min-w-full w-max max-w-none resize-y bg-transparent px-3 py-3 font-mono text-xs leading-6 text-syntax-muted outline-none transition placeholder:text-syntax-muted focus:bg-syntax-text/[0.04] [tab-size:2]`}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          style={{ whiteSpace: 'pre' }}
          value={code}
          wrap="off"
        />
      </div>
    </div>
  );
}
