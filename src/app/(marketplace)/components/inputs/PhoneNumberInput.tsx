'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';

import useCountries from '@/app/(marketplace)/hooks/useCountries';

interface PhoneNumberInputProps {
  countryCode: string;
  onCountryChange: (countryCode: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  hint?: string;
  inputId?: string;
}

const priorityCountries = ['IT', 'US', 'GB', 'FR', 'ES', 'DE', 'CA', 'AU'];

const preloadImages = (sources: string[]) => {
  if (typeof window === 'undefined') {
    return Promise.resolve([]);
  }

  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = src;
        }),
    ),
  );
};

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  countryCode,
  onCountryChange,
  value,
  onValueChange,
  disabled,
  error,
  label = 'Phone number',
  hint,
  inputId,
}) => {
  const { getAll } = useCountries();

  const countryOptions = useMemo(() => {
    const all = getAll();
    const withDialCode = all.filter((country) => country.dialCode);

    const prioritized = withDialCode.filter((country) =>
      priorityCountries.includes(country.value)
    );

    const remaining = withDialCode.filter(
      (country) => !priorityCountries.includes(country.value)
    );

    const sortedRemaining = remaining.sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    const unique = new Map<string, typeof withDialCode[number]>();
    [...prioritized, ...sortedRemaining].forEach((country) => {
      if (!unique.has(country.value)) {
        unique.set(country.value, country);
      }
    });

    return Array.from(unique.values());
  }, [getAll]);

  const selectedCountry = useMemo(() => {
    return (
      countryOptions.find((country) => country.value === countryCode) ||
      countryOptions[0]
    );
  }, [countryOptions, countryCode]);

  const [flagSrc, setFlagSrc] = useState<string | null>(null);
  const [flagsReady, setFlagsReady] = useState(false);

  useEffect(() => {
    if (!selectedCountry?.value) {
      setFlagSrc(null);
      return;
    }

    setFlagSrc(`/flags/${selectedCountry.value.toLowerCase()}.svg`);
  }, [selectedCountry?.value]);

  const flagSources = useMemo(
    () => countryOptions.map((country) => `/flags/${country.value.toLowerCase()}.svg`),
    [countryOptions],
  );

  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      if (!flagSources.length) {
        setFlagsReady(true);
        return;
      }

      setFlagsReady(false);
      await preloadImages(flagSources);
      if (!cancelled) {
        setFlagsReady(true);
      }
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [flagSources]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="flex flex-row gap-2 sm:flex-row">
       <div className="relative w-full sm:max-w-[180px]">
        {selectedCountry && flagSrc && flagsReady && (
          <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
            <Image
              src={flagSrc}
              alt={selectedCountry.label}
              width={20}
              height={14}
              className="h-4 w-6 rounded-sm object-cover"
              onError={() => setFlagSrc('/flags/globe.svg')}
            />
          </div>
        )}

        <select
          className={twMerge(
            'w-full appearance-none uppercase rounded-xl bg-white py-3 pl-10 pr-10 text-xs font-medium text-neutral-800 shadow-md transition',
            disabled ? 'opacity-60' : ''
          )}
          value={selectedCountry?.value ?? ''}
          onChange={(event) => onCountryChange(event.target.value)}
          disabled={disabled || !countryOptions.length}
          aria-label="Country dial code"
        >
          {countryOptions.map((country) => (
            <option key={country.value} value={country.value}>
              {/* put country name first so typing "it" jumps to Italy */}
              {`${country.label} (${country.dialCode ?? ''})`}
            </option>
          ))}
        </select>

        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
      </div>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={twMerge(
            'w-full rounded-xl bg-white px-4 py-2 text-base font-light text-neutral-900 shadow-md transition',
            disabled ? 'opacity-60' : '',
            error ? 'border-rose-500' : ''
          )}
          placeholder="Your phone number"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
        />
      </div>
      {hint && !error && (
        <p className="text-xs text-neutral-500">{hint}</p>
      )}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;