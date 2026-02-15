'use client';

import { useEffect } from 'react';

import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';
import type { LanguageCode } from '@/app/(marketplace)/constants/locale';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          elementId: string,
        ) => unknown;
      };
    };
  }
}

const LANGUAGE_TO_GOOGLE: Record<LanguageCode, string> = {
  en: 'en',
  az: 'az',
  de: 'de',
  es: 'es',
  fr: 'fr',
  it: 'it',
  nl: 'nl',
  pl: 'pl',
  tr: 'tr',
  ru: 'ru',
  zh: 'zh-CN',
  ja: 'ja',
  ar: 'ar',
};

const setGoogleTranslateCookie = (targetLanguage: string) => {
  const value = `/en/${targetLanguage}`;
  document.cookie = `googtrans=${value};path=/`;
  document.cookie = `googtrans=${value};path=/;domain=${window.location.hostname}`;
};

const applyGoogleTranslation = (targetLanguage: string) => {
  setGoogleTranslateCookie(targetLanguage);

  const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (!combo) {
    return false;
  }

  if (combo.value !== targetLanguage) {
    combo.value = targetLanguage;
    combo.dispatchEvent(new Event('change'));
  }

  return true;
};

const GlobalLanguageTranslator = () => {
  const languageCode = useLocaleSettings((state) => state.languageCode);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.googleTranslateElementInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) {
        return;
      }

      // eslint-disable-next-line no-new
      new TranslateElement(
        {
          pageLanguage: 'en',
          autoDisplay: false,
          includedLanguages: Array.from(new Set(Object.values(LANGUAGE_TO_GOOGLE))).join(','),
        },
        'google_translate_element',
      );
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit?.();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const targetLanguage = LANGUAGE_TO_GOOGLE[languageCode] ?? 'en';
    setGoogleTranslateCookie(targetLanguage);

    let attempts = 0;
    const maxAttempts = 20;
    const timer = window.setInterval(() => {
      attempts += 1;
      const applied = applyGoogleTranslation(targetLanguage);
      if (applied || attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [languageCode]);

  return <div id="google_translate_element" className="hidden" aria-hidden="true" />;
};

export default GlobalLanguageTranslator;
