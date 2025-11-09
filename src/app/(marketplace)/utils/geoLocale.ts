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

const getLocaleFromNavigator = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const { navigator } = window;
  if (!navigator) {
    return undefined;
  }

  return navigator.languages?.[0] ?? navigator.language;
};

const inferRegionFromLocale = (locale: string | undefined) => {
  if (!locale) {
    return undefined;
  }

  try {
    if (typeof (Intl as any).Locale === 'function') {
      const intlLocale = new (Intl as any).Locale(locale);
      const maximized = intlLocale.maximize?.() ?? intlLocale;
      return maximized.region ?? undefined;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to parse locale region', error);
    }
  }

  const parts = locale.split(/[-_]/);
  return parts[1]?.toUpperCase();
};

const inferCountryName = (locale: string | undefined, region: string | undefined) => {
  if (!region) {
    return undefined;
  }

  if (typeof Intl.DisplayNames === 'undefined') {
    return undefined;
  }

  try {
    const displayNames = new Intl.DisplayNames(locale ? [locale] : ['en'], { type: 'region' });
    return displayNames.of(region);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to resolve country name from region', error);
    }
    return undefined;
  }
};

const inferCityFromTimeZone = () => {
  if (typeof Intl === 'undefined') {
    return undefined;
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) {
      return undefined;
    }

    const segments = tz.split('/');
    if (segments.length < 2) {
      return undefined;
    }

    return segments[segments.length - 1]?.replace(/_/g, ' ');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to infer city from timezone', error);
    }
    return undefined;
  }
};

export const buildBrowserLocaleSuggestion = (): GeoLocaleSuggestion | undefined => {
  const locale = getLocaleFromNavigator();
  const language = locale?.split(/[-_]/)[0]?.toLowerCase() as LanguageCode | undefined;
  const languageOption =
    (language ? LANGUAGE_OPTIONS.find((option) => option.code === language) : undefined) ??
    DEFAULT_LANGUAGE;

  const regionFromLocale = inferRegionFromLocale(locale)?.toUpperCase();
  const resolvedRegion = (regionFromLocale ?? languageOption.region)?.toUpperCase();

  if (!resolvedRegion) {
    return undefined;
  }

  const localeForNames = locale ?? languageOption.locale;
  const inferredCountryName =
    inferCountryName(localeForNames, resolvedRegion) ?? inferCountryName('en-US', resolvedRegion);

  const response: GeoLocationResponse = {
    city: inferCityFromTimeZone(),
    country_name: inferredCountryName ?? languageOption.language,
    country_code: resolvedRegion,
    languages: language ?? languageOption.code,
    currency: languageOption.defaultCurrency,
  };

  return buildGeoLocaleSuggestion(response);
};
