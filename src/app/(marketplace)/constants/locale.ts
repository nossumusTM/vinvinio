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
  symbol: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { language: 'English',     code: 'en', locale: 'en-US',     region: 'US', flag: 'us', defaultCurrency: 'USD' },
  { language: 'Azerbaijani', code: 'az', locale: 'az-Latn-AZ', region: 'AZ', flag: 'az', defaultCurrency: 'AZN' },
  { language: 'Deutsch',     code: 'de', locale: 'de-DE',     region: 'DE', flag: 'de', defaultCurrency: 'EUR' },
  { language: 'Español',     code: 'es', locale: 'es-ES',     region: 'ES', flag: 'es', defaultCurrency: 'EUR' },
  { language: 'Français',    code: 'fr', locale: 'fr-FR',     region: 'FR', flag: 'fr', defaultCurrency: 'EUR' },
  { language: 'Italiano',    code: 'it', locale: 'it-IT',     region: 'IT', flag: 'it', defaultCurrency: 'EUR' },
  { language: 'Nederlands',  code: 'nl', locale: 'nl-NL',     region: 'NL', flag: 'nl', defaultCurrency: 'EUR' },
  { language: 'Polski',      code: 'pl', locale: 'pl-PL',     region: 'PL', flag: 'pl', defaultCurrency: 'PLN' },
  { language: 'Turkish',     code: 'tr', locale: 'tr-TR',     region: 'TR', flag: 'tr', defaultCurrency: 'TRY' },
  { language: 'Russian',     code: 'ru', locale: 'ru-RU',     region: 'RU', flag: 'ru', defaultCurrency: 'RUB' },
  { language: 'Chinese',     code: 'zh', locale: 'zh-CN',     region: 'CN', flag: 'cn', defaultCurrency: 'CNY' },
  { language: 'Japanese',    code: 'ja', locale: 'ja-JP',     region: 'JP', flag: 'jp', defaultCurrency: 'JPY' },
  { language: 'Arabic',      code: 'ar', locale: 'ar-AE',     region: 'AE', flag: 'ae', defaultCurrency: 'AED' },
];

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { currency: 'USD', code: 'USD', currencyName: 'US Dollar',         region: 'US', flag: 'us', symbol: '$' },
  { currency: 'AZN', code: 'AZN', currencyName: 'Azerbaijani Manat', region: 'AZ', flag: 'az', symbol: '₼' },
  { currency: 'EUR', code: 'EUR', currencyName: 'Euro',              region: 'EU', flag: 'eu', symbol: '€' },
  { currency: 'PLN', code: 'PLN', currencyName: 'Polish Złoty',      region: 'PL', flag: 'pl', symbol: 'zł' },
  { currency: 'TRY', code: 'TRY', currencyName: 'Turkish Lira',      region: 'TR', flag: 'tr', symbol: '₺' },
  { currency: 'RUB', code: 'RUB', currencyName: 'Russian Ruble',     region: 'RU', flag: 'ru', symbol: '₽' },
  { currency: 'CNY', code: 'CNY', currencyName: 'Chinese Yuan',      region: 'CN', flag: 'cn', symbol: '¥' },
  { currency: 'JPY', code: 'JPY', currencyName: 'Japanese Yen',      region: 'JP', flag: 'jp', symbol: '¥' },
  { currency: 'AED', code: 'AED', currencyName: 'UAE Dirham',        region: 'AE', flag: 'ae', symbol: 'د.إ' },
];

export const DEFAULT_LANGUAGE = LANGUAGE_OPTIONS[0];
export const DEFAULT_CURRENCY =
  CURRENCY_OPTIONS.find((option) => option.code === 'EUR') ?? CURRENCY_OPTIONS[0];
export const BASE_CURRENCY = process.env.NEXT_PUBLIC_BASE_CURRENCY ?? 'EUR';

export const CURRENCY_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.09,
  AZN: 1.85,
  PLN: 4.32,
  TRY: 35.2,
  RUB: 99.8,
  CNY: 7.9,
  JPY: 168.5,
  AED: 4,
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
