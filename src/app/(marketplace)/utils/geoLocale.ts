import {
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  getCurrencyOption,
  type LanguageCode,
} from '@/app/(marketplace)/constants/locale';

export type GeoLocationResponse = {
  city?: string;
  country_name?: string;
  country?: string;
  country_code?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  languages?: string;
  currency?: string;
};

export type GeoLocaleSuggestion = {
  city?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  languageCode?: LanguageCode;
  currencyCode?: string;
  locationValue?: string;
};

const normaliseLanguageCode = (code: string) => code.toLowerCase().split(/[-_]/)[0];

const deriveLanguage = (
  response: GeoLocationResponse,
): LanguageCode | undefined => {
  const { languages, country_code } = response;
  if (languages) {
    const candidates = languages
      .split(',')
      .map((entry) => entry.split(';')[0])
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map(normaliseLanguageCode);

    for (const candidate of candidates) {
      const match = LANGUAGE_OPTIONS.find((option) => option.code === candidate);
      if (match) {
        return match.code;
      }
    }
  }

  if (country_code) {
    const matchByRegion = LANGUAGE_OPTIONS.find(
      (option) => option.region.toLowerCase() === country_code.toLowerCase(),
    );
    if (matchByRegion) {
      return matchByRegion.code;
    }
  }

  return undefined;
};

const simpleSlugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const deriveCurrency = (response: GeoLocationResponse): string | undefined => {
  const { currency, country_code } = response;
  if (currency) {
    const option = getCurrencyOption(currency);
    if (option.currency === currency) {
      return option.currency;
    }
  }

  if (country_code) {
    const matchByRegion = LANGUAGE_OPTIONS.find(
      (option) => option.region.toLowerCase() === country_code.toLowerCase(),
    );
    if (matchByRegion) {
      return matchByRegion.defaultCurrency;
    }
  }

  return undefined;
};

const deriveLocationValue = (city?: string, countryCode?: string) => {
  if (!countryCode) {
    return undefined;
  }

  if (!city) {
    return countryCode.toUpperCase();
  }

  const slug = simpleSlugify(city);
  return `${slug}-${countryCode.toUpperCase()}`;
};

export const buildGeoLocaleSuggestion = (
  response: GeoLocationResponse,
): GeoLocaleSuggestion => {
  const languageCode = deriveLanguage(response) ?? DEFAULT_LANGUAGE.code;
  const currencyCode = deriveCurrency(response);

  return {
    city: response.city,
    country: response.country_name || response.country,
    countryCode: response.country_code?.toUpperCase(),
    region: response.region,
    latitude: response.latitude,
    longitude: response.longitude,
    languageCode,
    currencyCode,
    locationValue: deriveLocationValue(response.city, response.country_code),
  };
};
