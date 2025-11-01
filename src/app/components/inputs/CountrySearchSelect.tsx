'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LuMapPin, LuSparkles } from 'react-icons/lu';
import clsx from 'clsx';

import useCountries from '@/app/hooks/useCountries';

export type CountrySelectValue = {
  flag: string;
  label: string;
  latlng: number[];
  region: string;
  value: string;
  city?: string;
};

export type CountrySearchSelectHandle = {
  focus: () => void;
};

interface CountrySelectProps {
  value?: CountrySelectValue | null;
  onChange: (value: CountrySelectValue | undefined) => void;
  hasError?: boolean;
  onErrorCleared?: () => void;
}

type Suggestion = CountrySelectValue & {
  isPopular?: boolean;
};

const TAGLINE = 'Activities to do · Experiences to live';

const CountrySearchSelect = forwardRef<CountrySearchSelectHandle, CountrySelectProps>(
  ({ value, onChange, hasError = false, onErrorCleared }, ref) => {
    const { getAll, getPopularCities } = useCountries();

    const inputRef = useRef<HTMLInputElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const popularSuggestions = useMemo(() => {
      return getPopularCities().map((entry) => ({
        ...entry,
        isPopular: true,
      }));
    }, [getPopularCities]);

    const countrySuggestions = useMemo(() => getAll(), [getAll]);

    const combinedSuggestions = useMemo(() => {
      const dataset: Suggestion[] = [...popularSuggestions, ...countrySuggestions];
      const searchTerm = query.trim().toLowerCase();

      if (!searchTerm) {
        // show a curated subset when the user just focuses the field
        return dataset.slice(0, 20);
      }

      const unique = new Map<string, Suggestion>();
      dataset.forEach((item) => {
        const displayName = `${item.city ? `${item.city}, ` : ''}${item.label}`.toLowerCase();
        const matchesCity = item.city?.toLowerCase().includes(searchTerm);
        const matchesCountry = item.label.toLowerCase().includes(searchTerm);

        if (matchesCity || matchesCountry) {
          unique.set(item.value, item);
        }
      });

      return Array.from(unique.values()).slice(0, 30);
    }, [countrySuggestions, popularSuggestions, query]);

    const formatDisplayValue = useCallback((option?: CountrySelectValue | null) => {
      if (!option) return '';
      if (option.city) return `${option.city}, ${option.label}`;
      return option.label;
    }, []);

    const handleSelect = useCallback(
      (option: Suggestion | undefined) => {
        if (!option) return;
        onChange(option);
        onErrorCleared?.();
        setQuery(formatDisplayValue(option));
        setIsOpen(false);
      },
      [formatDisplayValue, onChange, onErrorCleared],
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          setIsOpen(true);
          requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          });
        },
      }),
      [],
    );

    useEffect(() => {
      setQuery(formatDisplayValue(value ?? undefined));
    }, [value, formatDisplayValue]);

    useEffect(() => {
      setHighlightedIndex((prev) => {
        if (combinedSuggestions.length === 0) {
          return 0;
        }
        return Math.min(prev, combinedSuggestions.length - 1);
      });
    }, [combinedSuggestions.length]);

    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (!wrapperRef.current) return;
        if (!wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (!hasError) return;
      setIsOpen(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }, [hasError]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setIsOpen(true);
      setHighlightedIndex(0);
      if (event.target.value === '') {
        onChange(undefined);
      }
      if (hasError) {
        onErrorCleared?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        setIsOpen(true);
        return;
      }

      if (!combinedSuggestions.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % combinedSuggestions.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + combinedSuggestions.length) % combinedSuggestions.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const option = combinedSuggestions[highlightedIndex];
        handleSelect(option);
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      if (!isOpen) return;
      const listbox = listboxRef.current;
      if (!listbox) return;
      const active = listbox.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      active?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex, isOpen]);

    const borderClass = clsx(
      'transition ring-0 focus-within:ring-0 rounded-2xl border-2 bg-white/90 backdrop-blur shadow-sm hover:shadow-md',
      hasError
        ? 'border-[#2200ffff] shadow-[0_0_0_2px_rgba(34,0,255,0.35)]'
        : 'border-white/60 hover:border-neutral-200',
    );

    return (
      <div ref={wrapperRef} className="relative">
        <label className="sr-only" htmlFor="destination-search">
          Search destinations
        </label>
        <div className={borderClass}>
          <div className="flex items-center gap-3 px-4 py-3">
            <LuMapPin className="h-5 w-5 text-neutral-500" aria-hidden="true" />
            <input
              id="destination-search"
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search for a country or city"
              className="w-full bg-transparent text-sm md:text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              autoComplete="off"
            />
          </div>
        </div>

        {hasError && (
          <p className="mt-2 text-sm font-medium text-rose-600">
            Please choose a destination to continue.
          </p>
        )}

        {isOpen && combinedSuggestions.length > 0 && (
          <ul
            ref={listboxRef}
            role="listbox"
            className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/60"
          >
            {combinedSuggestions.map((option, index) => {
              const displayValue = formatDisplayValue(option);
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={`${option.value}-${option.city ?? option.label}`}
                  role="option"
                  data-highlighted={isHighlighted ? 'true' : undefined}
                  aria-selected={value?.value === option.value}
                  className={clsx(
                    'cursor-pointer px-4 py-3 transition-colors',
                    isHighlighted ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white',
                        option.isPopular ? 'border-amber-300 bg-amber-50 text-amber-500' : 'text-neutral-500',
                      )}
                    >
                      {option.isPopular ? (
                        <LuSparkles className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <LuMapPin className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-neutral-900">
                        {displayValue}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {TAGLINE}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  },
);

CountrySearchSelect.displayName = 'CountrySearchSelect';

export default CountrySearchSelect;
