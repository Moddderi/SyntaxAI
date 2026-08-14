import type { ReactElement } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import type { Locale } from '../storage/localeStorage';

interface SettingsLanguageControlProps {
  onChange?: () => void;
}

export function SettingsLanguageControl({
  onChange,
}: SettingsLanguageControlProps): ReactElement {
  const { locale, setLocale, t } = useTranslation();

  const handleSelect = (nextLocale: Locale): void => {
    if (nextLocale === locale) {
      return;
    }

    void setLocale(nextLocale).then(() => {
      onChange?.();
    });
  };

  return (
    <div className="flex rounded-xl border border-syntax-border bg-syntax-inset p-1">
      {(['en', 'uk'] as const).map((option) => {
        const isActive = locale === option;

        return (
          <button
            key={option}
            aria-pressed={isActive}
            className={`min-w-[4.5rem] rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
              isActive
                ? 'bg-syntax-card text-syntax-text shadow-sm'
                : 'text-syntax-muted hover:text-syntax-text'
            }`}
            onClick={() => handleSelect(option)}
            type="button"
          >
            {option === 'en' ? t('settingsLangEn') : t('settingsLangUk')}
          </button>
        );
      })}
    </div>
  );
}
