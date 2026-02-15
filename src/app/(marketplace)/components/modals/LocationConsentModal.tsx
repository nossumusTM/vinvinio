'use client';

import { useMemo, useRef } from 'react';
import { LuGlobe2 } from 'react-icons/lu';

import Modal from './Modal';
import useGeoLocationExperiment from '@/app/(marketplace)/hooks/useGeoLocationExperiment';
import {
  LANGUAGE_OPTIONS,
  getCurrencyOption,
} from '@/app/(marketplace)/constants/locale';
import useLocaleModal from '@/app/(marketplace)/hooks/useLocaleModal';
import CountrySearchSelect, {
  type CountrySearchSelectHandle,
  type CountrySelectValue,
} from '@/app/(marketplace)/components/inputs/CountrySearchSelect';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';

const LocalePreview: React.FC<{
  languageCode?: string;
  currencyCode?: string;
  onClick: () => void;
}> = ({ languageCode, currencyCode, onClick }) => {
  const languageOption = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.code === languageCode) ?? LANGUAGE_OPTIONS[0],
    [languageCode],
  );

  const currencyOption = useMemo(
    () => getCurrencyOption(currencyCode ?? languageOption.defaultCurrency),
    [currencyCode, languageOption.defaultCurrency],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-left shadow-sm transition hover:border-neutral-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
        <LuGlobe2 className="h-5 w-5" />
      </span>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-neutral-400">Locale preview</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
          <span>{languageOption.language}</span>
          <span aria-hidden className="mx-1 h-4 w-px bg-neutral-300" />
          <span>
            {currencyOption.symbol} · {currencyOption.currency}
          </span>
        </span>
        <span className="mt-1 text-xs text-neutral-500">Tap to adjust language & currency</span>
      </div>
    </button>
  );
};

const LocationConsentModal = () => {
  const localeModal = useLocaleModal();

  const isLocaleOpen = localeModal.isOpen;
  const noop = () => {};

  const { getByValue } = useCountries();
  const locationInputRef = useRef<CountrySearchSelectHandle | null>(null);

  const { detection, isOpen, accept, decline, setDetection } = useGeoLocationExperiment((state) => ({
    detection: state.detection,
    isOpen: state.isOpen && !!state.detection,
    accept: state.accept,
    decline: state.decline,
    setDetection: state.setDetection,
  }));

  const { languageCode: selectedLanguageCode, currency: selectedCurrency } = useLocaleSettings();

  // const handleProceed = () => {
  //   if (detection) {
  //     setDetection({
  //       ...detection,
  //       languageCode: previewLanguageCode,
  //       currencyCode: previewCurrencyCode,
  //     });
  //   }
  //   accept();
  // };

  const handleProceed = () => {
    if (detection) {
      setDetection({
        ...detection,
        languageCode: previewLanguageCode,
        currencyCode: previewCurrencyCode,
      });
    }
    accept();
  };

  // if (process.env.NODE_ENV !== 'production') {
  //   console.log('[geo] consent modal state', {
  //     hasDetection: !!detection,
  //     isOpen,
  //   });
  // }

  const detectedCountry = useMemo(() => {
    if (!detection?.countryCode) {
      return undefined;
    }
    return getByValue(detection.countryCode);
  }, [detection?.countryCode, getByValue]);

  const detectedLocationValue = useMemo<CountrySelectValue | null>(() => {
    if (!detection) {
      return null;
    }

    if (!detectedCountry) {
      if (!detection.locationValue && !detection.country && !detection.city) {
        return null;
      }

      return {
        flag: '🌍',
        label: detection.country ?? detection.countryCode ?? 'Detected region',
        value: detection.locationValue ?? detection.countryCode ?? 'detected-region',
        latlng: [detection.latitude ?? 0, detection.longitude ?? 0],
        region: detection.region ?? detection.countryCode ?? 'Unknown',
        city: detection.city,
      };
    }

    return {
      ...detectedCountry,
      value: detection.locationValue ?? detectedCountry.value,
      city: detection.city ?? detectedCountry.city,
      latlng: [
        detection.latitude ?? detectedCountry.latlng[0],
        detection.longitude ?? detectedCountry.latlng[1],
      ],
    };
  }, [
    detectedCountry,
    detection?.city,
    detection?.country,
    detection?.countryCode,
    detection?.latitude,
    detection?.locationValue,
    detection?.longitude,
    detection?.region,
  ]);

  // if (!detection) {
  //   return null;
  // }

  const locationSummary = useMemo(() => {
    const country = detection?.country ?? detection?.countryCode ?? 'your area';
    const city = detection?.city?.trim();

    if (city) {
      return `${city}, ${country}`;
    }

    return country;
  }, [detection?.city, detection?.country, detection?.countryCode]);

  const message = `We spotted that you're visiting from ${locationSummary}. Would you like us to tailor the listings to this location?`;

  const handleLocationChange = (value: CountrySelectValue | undefined) => {
    if (!value || !detection) return;

    const valueParts = value.value.split('-');
    const inferredCountryCode = valueParts[valueParts.length - 1]?.toUpperCase();

    setDetection({
      ...detection,
      city: value.city,
      country: value.label,
      countryCode: inferredCountryCode ?? detection.countryCode,
      latitude: value.latlng?.[0] ?? detection.latitude,
      longitude: value.latlng?.[1] ?? detection.longitude,
      locationValue: value.value,
    });
  };

  const currencyFromCountry = (code?: string): string | undefined => {
    if (!code) return;
    const c = code.toUpperCase();
    const MAP: Record<string, string> = {
      AT:'EUR', BE:'EUR', CY:'EUR', EE:'EUR', FI:'EUR', FR:'EUR', DE:'EUR', GR:'EUR',
      IE:'EUR', IT:'EUR', LV:'EUR', LT:'EUR', LU:'EUR', MT:'EUR', NL:'EUR', PT:'EUR',
      SK:'EUR', SI:'EUR', ES:'EUR',
      US:'USD', CA:'CAD', GB:'GBP', CH:'CHF', AU:'AUD', NZ:'NZD', JP:'JPY',
      CN:'CNY', HK:'HKD', SG:'SGD', AE:'AED', SA:'SAR', TR:'TRY', IN:'INR',
      BR:'BRL', MX:'MXN', ZA:'ZAR', SE:'SEK', NO:'NOK', DK:'DKK', CZ:'CZK',
      PL:'PLN', HU:'HUF', RO:'RON', BG:'BGN', HR:'EUR', IS:'ISK',
    };
    return MAP[c];
  };


  const EN_CODE = useMemo(
    () => LANGUAGE_OPTIONS.find(o => o.code.startsWith('en'))?.code ?? LANGUAGE_OPTIONS[0].code,
    []
  );

  // const previewLanguageCode = useMemo(() => {
  //   const detected = detection?.languageCode;
  //   const selected = selectedLanguageCode;
  //   // prefer detection until user picks something different
  //   if (selected && selected !== detected) return selected;
  //   return detected ?? LANGUAGE_OPTIONS[0].code;
  // }, [detection?.languageCode, selectedLanguageCode]);

  const previewLanguageCode = useMemo(() => {
    return selectedLanguageCode ?? detection?.languageCode ?? EN_CODE;
  }, [selectedLanguageCode, detection?.languageCode, EN_CODE]);

  // const previewCurrencyCode = useMemo(() => {
  //   const detected = detection?.currencyCode;
  //   const selected = selectedCurrency;

  //   // if user picked a different currency, show it
  //   if (selected && selected !== detected) return selected;

  //   // otherwise prefer detected; if none, fall back to the default of the preview language
  //   const fallbackLang =
  //     LANGUAGE_OPTIONS.find(o => o.code === previewLanguageCode) ?? LANGUAGE_OPTIONS[0];
  //   return detected ?? fallbackLang.defaultCurrency;
  // }, [detection?.currencyCode, selectedCurrency, previewLanguageCode]);

  const previewCurrencyCode = useMemo(() => {
    if (selectedCurrency) return selectedCurrency;
    if (detection?.currencyCode) return detection.currencyCode;                       // use detected (e.g., EUR for IT)
    const byCountry = currencyFromCountry(detection?.countryCode);
    if (byCountry) return byCountry;                                                  // derive from country if needed
    const lang = LANGUAGE_OPTIONS.find(o => o.code === previewLanguageCode) ?? LANGUAGE_OPTIONS[0];
    return lang.defaultCurrency;
  }, [selectedCurrency, detection?.currencyCode, detection?.countryCode, previewLanguageCode]);

  return (
    <Modal
      title='Geolocation'
      isOpen={isOpen}
      onClose={isLocaleOpen ? noop : decline}
      onSubmit={handleProceed}
      actionLabel="Proceed"
      secondaryAction={decline}
      secondaryActionLabel="No, thanks"
      className="px-6"
      submitOnEnter={false}
      preventOutsideClose={isLocaleOpen}
      body={(
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-left">
            {/* <h2 className="text-2xl font-semibold text-neutral-900">Detected Location by IP</h2> */}
            <p className="text-md md:text-xl text-neutral-600">{message}</p>
            <div className="pb-1 pt-1 flex justify-center items-center">
              <div className="w-fit inline-flex items-center gap-2 rounded-xl shadow-md px-3 py-2 text-md font-medium text-neutral-800">
                <span className="text-sm inline-flex items-center rounded-md bg-emerald-500/20 px-3 py-[4px] font-semibold text-emerald-700">
                  {locationSummary}
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-neutral-600">
              You can also fine-tune your destination below or adjust your language & currency preferences.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="p-4 border border-neutral-200 rounded-2xl flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Destination
              </span>
              <CountrySearchSelect
                ref={locationInputRef}
                value={detectedLocationValue}
                onChange={handleLocationChange}
              />
            </div>

            <LocalePreview
              languageCode={previewLanguageCode}
              currencyCode={previewCurrencyCode}
              onClick={localeModal.onOpen}
            />
          </div>
        </div>
      )}
    />
  );
};

export default LocationConsentModal;
