import type { ReactElement } from 'react';
import { CodeBlock } from './CodeBlock';
import { CodeEditorField } from './CodeEditorField';
import { CapturePanelLoader } from './CapturePanelLoader';
import { getCodeBlockLanguageLabel } from '../utils/codeLanguage';

interface CodeCapturePanelProps {
  code: string;
  language: string;
  isAnalyzing: boolean;
  isEditing: boolean;
  onCodeChange: (value: string) => void;
}

export function CodeCapturePanel({
  code,
  language,
  isAnalyzing,
  isEditing,
  onCodeChange,
}: CodeCapturePanelProps): ReactElement {
  const languageLabel = getCodeBlockLanguageLabel(language);

  if (isAnalyzing) {
    return (
      <CapturePanelLoader
        headerLabel={languageLabel}
        label="Formatting code…"
        minHeightClass="min-h-[180px]"
      />
    );
  }

  if (isEditing || !code.trim()) {
    return <CodeEditorField code={code} language={language} onChange={onCodeChange} />;
  }

  return (
    <div className="animate-fade-in">
      <CodeBlock code={code} language={language} showCopy showLanguageLabel size="sm" />
    </div>
  );
}
