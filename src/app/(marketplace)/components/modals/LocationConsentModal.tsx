'use client';

import { useMemo } from 'react';
import { LuGlobe2 } from 'react-icons/lu';

import Modal from './Modal';
import useGeoLocationExperiment from '@/app/(marketplace)/hooks/useGeoLocationExperiment';
import {
  LANGUAGE_OPTIONS,
  getCurrencyOption,
} from '@/app/(marketplace)/constants/locale';

const isExperimentEnabled = process.env.NEXT_PUBLIC_GEOLOCATION_EXPERIMENT === 'true';

const LocalePreview: React.FC<{
  languageCode?: string;
  currencyCode?: string;
}> = ({ languageCode, currencyCode }) => {
  const languageOption = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.code === languageCode) ?? LANGUAGE_OPTIONS[0],
    [languageCode],
  );

  const currencyOption = useMemo(
    () => getCurrencyOption(currencyCode ?? languageOption.defaultCurrency),
    [currencyCode, languageOption.defaultCurrency],
  );

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 shadow-sm">
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
      </div>
    </div>
  );
};

const LocationConsentModal = () => {
  const { detection, isOpen, accept, decline } = useGeoLocationExperiment((state) => ({
    detection: state.detection,
    isOpen: state.isOpen && !!state.detection,
    accept: state.accept,
    decline: state.decline,
  }));

  if (!isExperimentEnabled || !detection) {
    return null;
  }

  const countryLabel = detection.city
    ? `${detection.city}, ${detection.country ?? detection.countryCode ?? 'your area'}`
    : detection.country ?? detection.countryCode ?? 'your area';

  const message = detection.city
    ? `We spotted that you're visiting from ${countryLabel}. Would you like us to tailor the listings to this location?`
    : `We spotted that you're visiting from ${countryLabel}. Would you like us to tailor the listings to this location?`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={decline}
      onSubmit={accept}
      actionLabel="Yes, show local listings"
      secondaryAction={decline}
      secondaryActionLabel="No, thanks"
      className="px-6"
      submitOnEnter={false}
      body={(
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-left">
            <h2 className="text-2xl font-semibold text-neutral-900">Use your location?</h2>
            <p className="text-sm text-neutral-600">{message}</p>
            <p className="text-sm text-neutral-600">
              We can also switch your language and currency preferences to match your area. Does that work for you?
            </p>
          </div>
          <LocalePreview languageCode={detection.languageCode} currencyCode={detection.currencyCode} />
        </div>
      )}
    />
  );
};

export default LocationConsentModal;
