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
import { LuMapPin, LuSparkles, LuX } from 'react-icons/lu';
import clsx from 'clsx';

import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import useCountries from '@/app/(marketplace)/hooks/useCountries';

import { createPortal } from 'react-dom';
import { useLayoutEffect } from 'react';

export type CountrySelectValue = {
  flag: string;
  label: string;
  latlng: [number, number];
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

// Rotating placeholder texts (first one is the default)
const ROTATING_ITEMS = [
  'Rome, Italy',
  'Hong Kong, China',
  'Baku, Azerbaijan',
  'Paris, France',
  'Istanbul, Türkiye',
  'Tokyo, Japan',
  'Barcelona, Spain',
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/türkiye|turkiye/g, 'turkey')
    .trim();

const extractCountryFromText = (text: string) => {
  const parts = text.split(',');
  // country is usually the last part (e.g., "Rome, Italy")
  return norm(parts[parts.length - 1] || '');
};

const destionationVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 28, mass: 0.3 } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { type: 'tween', duration: 0.18, ease: 'easeInOut' } },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 28, mass: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { type: 'tween', duration: 0.18, ease: 'easeInOut' },
  },
};

const CountrySearchSelect = forwardRef<CountrySearchSelectHandle, CountrySelectProps>(
  ({ value, onChange, hasError = false, onErrorCleared }, ref) => {
    const { getAll, getPopularCities } = useCountries();

    const inputRef = useRef<HTMLInputElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const [portalReady, setPortalReady] = useState(false);
    const [dropdownRect, setDropdownRect] = useState<{ left: number; top: number; width: number; } | null>(null);

    const popularSuggestions = useMemo(() => {
      return getPopularCities().map((entry) => ({
        ...entry,
        isPopular: true,
      }));
    }, [getPopularCities]);

    const countrySuggestions = useMemo(() => getAll(), [getAll]);

    // ✅ INSIDE the component, after countrySuggestions
    const displayedFlagCode = useMemo(() => {
      // 1) If user selected a value, lock to that country code
      if (value?.value) {
        // extract part after the last "-"
        const parts = value.value.toLowerCase().split('-');
        return parts[parts.length - 1]; // e.g. "milan-it" → "it"
      }

      // Helper: try find country code by country name
      const findCodeByCountryName = (countryNameLower: string) => {
        const match = countrySuggestions.find(
          (c) => norm(c.label) === countryNameLower
        );
        return match?.value?.toLowerCase();
      };

      // 2) If user is typing, infer by country part of the query (after comma)
      if (query.trim().length > 0) {
        const countryLower = extractCountryFromText(query);
        const byName = findCodeByCountryName(countryLower);
        if (byName) return byName;
      }

      // 3) No input/selection → use rotating item’s country
      const rotatingText = ROTATING_ITEMS[placeholderIndex];
      const countryLower = extractCountryFromText(rotatingText);
      const byName = findCodeByCountryName(countryLower);
      if (byName) return byName;

      // Fallback to a globe icon file if present
      return 'globe';
    }, [value?.value, query, placeholderIndex, countrySuggestions]);

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

    const handleClear = () => {
      setQuery('');
      onChange(undefined);
      setIsOpen(true); // keep dropdown open for a fresh pick (optional)
      setHighlightedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      if (hasError) onErrorCleared?.();
    };

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

     useEffect(() => {
       if (query.trim().length > 0) return; // pause rotation while user types
       const id = setInterval(() => {
         setPlaceholderIndex((i) => (i + 1) % ROTATING_ITEMS.length);
       }, 2200);
      return () => clearInterval(id);
    }, [query]);

     useEffect(() => { setPortalReady(true); }, []);
     
      const updateDropdownPosition = useCallback(() => {
        if (!wrapperRef.current) return;
        const r = wrapperRef.current.getBoundingClientRect();
        setDropdownRect({ left: r.left, top: r.bottom + 8, width: r.width });
      }, []);
      
      useLayoutEffect(() => {
        if (!isOpen) return;
        updateDropdownPosition();
        const onScroll = () => updateDropdownPosition();
        const onResize = () => updateDropdownPosition();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
          window.removeEventListener('scroll', onScroll, true);
          window.removeEventListener('resize', onResize);
        };
      }, [isOpen, updateDropdownPosition]);

    const borderClass = clsx(
      'transition ring-0 focus-within:ring-0 rounded-2xl border-2 bg-white/90 backdrop-blur shadow-sm hover:shadow-md',
      hasError
        ? 'border-[#2200ffff] shadow-[0_0_0_2px_rgba(34,0,255,0.35)]'
        : 'border-white/60 hover:border-neutral-200',
    );

    return (
      <div ref={wrapperRef} className="relative z-20">
        <label className="sr-only" htmlFor="destination-search">
          Search destinations
        </label>
        <div className={borderClass}>
          {/* INPUT ROW — single relative wrapper */}
<div className="relative flex items-center gap-3 px-4 py-3">
  {/* Flag */}
  <div className="h-4 w-6 items-center justify-center">
    <AnimatePresence mode="wait">
      <motion.img
        key={displayedFlagCode}
        src={`/flags/${displayedFlagCode}.svg`}
        alt=""
        aria-hidden="true"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={destionationVariants}
        className="mr-1.5 h-4 w-6 object-cover rounded"
      />
    </AnimatePresence>
  </div>

  {/* Input */}
  <input
    id="destination-search"
    ref={inputRef}
    value={query}
    onChange={handleInputChange}
    onFocus={() => {
      setIsOpen(true);
      setHighlightedIndex(0);
    }}
    onClick={() => {
      setIsOpen(true);
      setHighlightedIndex(0);
    }}
    onKeyDown={handleKeyDown}
    placeholder=""
    className="w-full pt-0.5 pr-9 bg-transparent text-sm md:text-[18px] font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
    autoComplete="off"
    inputMode="search"
  />

  {/* Clear (X) — perfectly centered on the right */}
  <AnimatePresence>
    {query.trim().length > 0 && (
      <motion.button
        type="button"
        aria-label="Clear destination"
        onClick={handleClear}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.28 }}
        className="
          absolute right-4 top-1/3.5 -translate-y-1/2
          h-5 w-5 flex items-center justify-center
          text-neutral-500 hover:text-neutral-800
          active:scale-95 select-none
        "
      >
        <LuX className="h-4 w-4" />
      </motion.button>
    )}
  </AnimatePresence>

  {/* Rotating placeholder (keeps clicks on input) */}
  {query.trim().length === 0 && (
    <div className="pointer-events-none absolute inset-0 flex items-center">
      <div className="flex items-center translate-x-[32px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={placeholderIndex}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            className="flex items-center"
          >
            <span className="ml-4 text-sm md:text-[18px] font-medium text-neutral-400">
              {ROTATING_ITEMS[placeholderIndex]}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )}
</div>


        {hasError && (
          <p className="mt-2 text-sm font-medium text-rose-600">
            Please choose a destination to continue.
          </p>
        )}

        {/* {isOpen && combinedSuggestions.length > 0 && (
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
        )} */}
        <AnimatePresence>
          {isOpen && combinedSuggestions.length > 0 && (
            <motion.ul
              ref={listboxRef}
              role="listbox"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownVariants}
              className="absolute z-[9999] mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/60 origin-top"
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
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      </div>
    );
  },
);

CountrySearchSelect.displayName = 'CountrySearchSelect';

export default CountrySearchSelect;
