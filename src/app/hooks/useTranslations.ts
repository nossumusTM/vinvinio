'use client';

import { useMemo } from 'react';

import useLocaleSettings from '@/app/hooks/useLocaleSettings';
import { getTranslations, type TranslationKey } from '@/app/locale/translations';
import type { LanguageCode } from '@/app/constants/locale';

const useTranslations = () => {
  const { languageCode } = useLocaleSettings();

  const dictionary = useMemo(() => getTranslations(languageCode as LanguageCode), [languageCode]);

  return (key: TranslationKey) => dictionary[key] ?? key;
};

export default useTranslations;
