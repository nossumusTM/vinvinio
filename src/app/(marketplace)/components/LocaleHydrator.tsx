'use client';

import { useEffect } from 'react';

import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';
import { isRtlLanguage } from '@/app/(marketplace)/constants/locale';

const LocaleHydrator = () => {
  const { languageCode } = useLocaleSettings();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = languageCode;
    html.dir = isRtlLanguage(languageCode) ? 'rtl' : 'ltr';
  }, [languageCode]);

  return null;
};

export default LocaleHydrator;
