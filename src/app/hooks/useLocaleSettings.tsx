import { create } from 'zustand';

interface LocaleSettingsState {
  language: string;
  currency: string;
  setLanguage: (language: string, currency: string) => void;
  setCurrency: (language: string, currency: string) => void;
}

const DEFAULT_LANGUAGE = 'English';
const DEFAULT_CURRENCY = 'USD';

const useLocaleSettings = create<LocaleSettingsState>((set) => ({
  language: DEFAULT_LANGUAGE,
  currency: DEFAULT_CURRENCY,
  setLanguage: (language, currency) => set({ language, currency }),
  setCurrency: (language, currency) => set({ language, currency }),
}));

export default useLocaleSettings;
