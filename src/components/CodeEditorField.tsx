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
    <div className="overflow-hidden rounded-xl border border-[#1c1c20] bg-[#1a1b1e]">
      <div className="flex items-center border-b border-[#1c1c20] bg-[#141417] px-3 py-1.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
          {languageLabel}
        </span>
      </div>

      <textarea
        aria-label="Code block"
        className={`${minHeightClass} w-full resize-y bg-transparent px-3 py-3 font-mono text-xs leading-6 text-gray-200 outline-none transition placeholder:text-gray-500 focus:bg-[#16171a] [tab-size:2]`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        style={{ whiteSpace: 'pre', overflowX: 'auto' }}
        value={code}
      />
    </div>
  );
}
