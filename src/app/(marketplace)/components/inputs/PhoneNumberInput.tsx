'use client';

import { useMemo } from 'react';
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

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
       <div className="relative w-full sm:max-w-[180px]">
        {selectedCountry && (
          <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
            <Image
              src={`/images/flags/${selectedCountry.value.toLowerCase()}.svg`}
              alt={selectedCountry.label}
              width={20}
              height={14}
              className="rounded-sm mb-1 h-4 w-6 object-cover"
            />
          </div>
        )}

        <select
          className={twMerge(
            'w-full appearance-none rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-neutral-800 shadow-sm transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black',
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
            'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base font-light text-neutral-900 shadow-sm transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black',
            disabled ? 'opacity-60' : '',
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-400/70' : ''
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