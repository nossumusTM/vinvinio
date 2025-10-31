import { ar, az, de, enUS, es, fr, it, ja, nl, pl, ru, tr, zhCN } from 'date-fns/locale';

export type LanguageCode =
  | 'en'
  | 'az'
  | 'de'
  | 'es'
  | 'fr'
  | 'it'
  | 'nl'
  | 'pl'
  | 'tr'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ar';

export interface LanguageOption {
  language: string;
  code: LanguageCode;
  locale: string;
  region: string;
  flag: string;
  defaultCurrency: string;
}

export interface CurrencyOption {
  currency: string;
  code: string;
  currencyName: string;
  region: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { language: 'English', code: 'en', locale: 'en-US', region: 'United States', flag: 'us', defaultCurrency: 'USD' },
  { language: 'Azerbaijani', code: 'az', locale: 'az-Latn-AZ', region: 'Azerbaijan', flag: 'az', defaultCurrency: 'AZN' },
  { language: 'Deutsch', code: 'de', locale: 'de-DE', region: 'Deutschland', flag: 'de', defaultCurrency: 'EUR' },
  { language: 'Español', code: 'es', locale: 'es-ES', region: 'España', flag: 'es', defaultCurrency: 'EUR' },
  { language: 'Français', code: 'fr', locale: 'fr-FR', region: 'France', flag: 'fr', defaultCurrency: 'EUR' },
  { language: 'Italiano', code: 'it', locale: 'it-IT', region: 'Italia', flag: 'it', defaultCurrency: 'EUR' },
  { language: 'Nederlands', code: 'nl', locale: 'nl-NL', region: 'Nederland', flag: 'nl', defaultCurrency: 'EUR' },
  { language: 'Polski', code: 'pl', locale: 'pl-PL', region: 'Polska', flag: 'pl', defaultCurrency: 'PLN' },
  { language: 'Turkish', code: 'tr', locale: 'tr-TR', region: 'Türkiye', flag: 'tr', defaultCurrency: 'TRY' },
  { language: 'Russian', code: 'ru', locale: 'ru-RU', region: 'Россия', flag: 'ru', defaultCurrency: 'RUB' },
  { language: 'Chinese', code: 'zh', locale: 'zh-CN', region: '中国', flag: 'cn', defaultCurrency: 'CNY' },
  { language: 'Japanese', code: 'ja', locale: 'ja-JP', region: '日本', flag: 'jp', defaultCurrency: 'JPY' },
  { language: 'Arabic', code: 'ar', locale: 'ar-AE', region: 'الإمارات العربية المتحدة', flag: 'ae', defaultCurrency: 'AED' },
];

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { currency: 'USD', code: 'USD', currencyName: 'US Dollar', region: 'United States', flag: 'us' },
  { currency: 'AZN', code: 'AZN', currencyName: 'Azerbaijani Manat', region: 'Azerbaijan', flag: 'az' },
  { currency: 'EUR', code: 'EUR', currencyName: 'Euro', region: 'European Union', flag: 'eu' },
  { currency: 'PLN', code: 'PLN', currencyName: 'Polish Złoty', region: 'Poland', flag: 'pl' },
  { currency: 'TRY', code: 'TRY', currencyName: 'Turkish Lira', region: 'Türkiye', flag: 'tr' },
  { currency: 'RUB', code: 'RUB', currencyName: 'Russian Ruble', region: 'Russia', flag: 'ru' },
  { currency: 'CNY', code: 'CNY', currencyName: 'Chinese Yuan', region: 'China', flag: 'cn' },
  { currency: 'JPY', code: 'JPY', currencyName: 'Japanese Yen', region: 'Japan', flag: 'jp' },
  { currency: 'AED', code: 'AED', currencyName: 'UAE Dirham', region: 'United Arab Emirates', flag: 'ae' },
];

export const DEFAULT_LANGUAGE = LANGUAGE_OPTIONS[0];
export const DEFAULT_CURRENCY = CURRENCY_OPTIONS[0];

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  AZN: 1.7,
  EUR: 0.92,
  PLN: 4.05,
  TRY: 32.5,
  RUB: 92,
  CNY: 7.1,
  JPY: 156,
  AED: 3.67,
};

export const DATE_FNS_LOCALES: Record<LanguageCode, Locale> = {
  en: enUS,
  az,
  de,
  es,
  fr,
  it,
  nl,
  pl,
  tr,
  ru,
  zh: zhCN,
  ja,
  ar,
};

export const RTL_LANGUAGES: LanguageCode[] = ['ar'];

export const isRtlLanguage = (code: LanguageCode) => RTL_LANGUAGES.includes(code);

export const getLanguageOption = (code: LanguageCode) =>
  LANGUAGE_OPTIONS.find((option) => option.code === code) ?? DEFAULT_LANGUAGE;

export const getCurrencyOption = (code: string) =>
  CURRENCY_OPTIONS.find((option) => option.code === code) ?? DEFAULT_CURRENCY;
