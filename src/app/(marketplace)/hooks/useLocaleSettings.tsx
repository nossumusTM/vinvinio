import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  getCurrencyOption,
  getLanguageOption,
  type LanguageCode,
} from '@/app/(marketplace)/constants/locale';

interface LocaleSettingsState {
  language: string;
  languageCode: LanguageCode;
  languageRegion: string;
  locale: string;
  currency: string;
  currencyRegion: string;
  currencySymbol: string; // ⬅️ ADD
  setLanguage: (code: LanguageCode) => void;
  setCurrency: (code: string) => void;
}

const useLocaleSettings = create<LocaleSettingsState>()(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE.language,
      languageCode: DEFAULT_LANGUAGE.code,
      languageRegion: DEFAULT_LANGUAGE.region,
      locale: DEFAULT_LANGUAGE.locale,
      currency: DEFAULT_CURRENCY.currency,
      currencyRegion: DEFAULT_CURRENCY.region,
      currencySymbol: DEFAULT_CURRENCY.symbol,
      setLanguage: (code) => {
        const option = getLanguageOption(code);
        set({
          language: option.language,
          languageCode: option.code,
          languageRegion: option.region,
          locale: option.locale,
        });
      },
      setCurrency: (code) => {
        const option = getCurrencyOption(code);
        set({
          currency: option.currency,
          currencyRegion: option.region,
          currencySymbol: option.symbol
        });
      },
    }),
    {
      name: 'locale-settings',
      merge: (persistedState, currentState) => {
        if (!persistedState) {
          return currentState;
        }

        const incoming = persistedState as Partial<LocaleSettingsState>;
        const nextState = { ...currentState, ...incoming };

        const languageOption = incoming.languageCode
          ? getLanguageOption(incoming.languageCode)
          : LANGUAGE_OPTIONS.find((option) => option.language === incoming.language) ?? DEFAULT_LANGUAGE;

        nextState.language = languageOption.language;
        nextState.languageCode = languageOption.code;
        nextState.languageRegion = languageOption.region;
        nextState.locale = languageOption.locale;

        const currencyOption = incoming.currency
          ? getCurrencyOption(incoming.currency)
          : DEFAULT_CURRENCY;

        nextState.currency = currencyOption.currency;
        nextState.currencyRegion = currencyOption.region;
        nextState.currencySymbol = currencyOption.symbol;

        return nextState;
      },
    }
  )
);

export default useLocaleSettings;
