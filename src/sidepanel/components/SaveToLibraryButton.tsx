import type { ReactElement } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface SaveToLibraryButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export function SaveToLibraryButton({
  onClick,
  disabled = false,
  isSaving = false,
}: SaveToLibraryButtonProps): ReactElement {
  const { t } = useTranslation();

  return (
    <button
      className="syntax-btn-primary syntax-focus-ring h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {isSaving ? t('sidePanelSaving') : t('sidePanelSaveToLibrary')}
    </button>
  );
}
