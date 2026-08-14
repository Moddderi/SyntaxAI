import { useCallback } from 'react';
import { translate, type TranslationKey } from '../i18n/translations';
import { useLocale } from './useLocale';

export function useTranslation(): {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locale: ReturnType<typeof useLocale>['locale'];
  setLocale: ReturnType<typeof useLocale>['setLocale'];
} {
  const { locale, setLocale } = useLocale();

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  return { t, locale, setLocale };
}
