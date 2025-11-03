'use client';

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { LuLoader2, LuMapPin } from 'react-icons/lu';

interface Suggestion {
  id: string;
  label: string;
  description?: string;
}

interface MeetingPointAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  errorMessage?: string;
}

const MIN_QUERY_LENGTH = 3;

const MeetingPointAutocomplete: React.FC<MeetingPointAutocompleteProps> = ({
  value = '',
  onChange,
  disabled = false,
  errorMessage,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  useEffect(() => {
    if (!isOpen || query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/locations/meeting-points?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch meeting points');
        }

        const payload = await response.json();
        const parsed: Suggestion[] = Array.isArray(payload?.suggestions)
          ? payload.suggestions.map((item: any) => ({
              id: String(item.id ?? item.place_id ?? item.label ?? Math.random()),
              label: item.label ?? item.display_name ?? '',
              description: item.description ?? item.subtitle ?? '',
            }))
          : [];

        setSuggestions(parsed);
        setHighlightedIndex(0);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) return;

    const listElement = listRef.current;
    if (!listElement) return;

    const activeItem = listElement.querySelector('[data-highlighted="true"]') as HTMLElement | null;
    activeItem?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.label);
    setQuery(suggestion.label);
    setIsOpen(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onChange(nextValue);
    setIsOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!suggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const suggestion = suggestions[highlightedIndex];
      if (suggestion) {
        handleSelect(suggestion);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const helperText = useMemo(() => {
    if (errorMessage) return errorMessage;
    if (!query || query.trim().length >= MIN_QUERY_LENGTH) return undefined;
    const remaining = MIN_QUERY_LENGTH - query.trim().length;
    return `Type ${remaining} more character${remaining === 1 ? '' : 's'} to search`;
  }, [errorMessage, query]);

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="meeting-point-search" className="text-md font-medium text-neutral-800">
        Meeting point
      </label>
      <div
        className={clsx(
          'mt-2 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition',
          errorMessage
            ? 'border-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]'
            : 'border-neutral-200 hover:border-neutral-300',
          disabled && 'opacity-60'
        )}
      >
        <LuMapPin className="h-5 w-5 text-neutral-500" aria-hidden="true" />
        <input
          id="meeting-point-search"
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for an address, venue, or meeting spot"
          disabled={disabled}
          autoComplete="off"
          aria-invalid={errorMessage ? 'true' : 'false'}
          className="w-full bg-transparent text-sm md:text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        {isLoading && <LuLoader2 className="h-5 w-5 animate-spin text-neutral-400" aria-hidden="true" />}
      </div>

      {helperText && (
        <p
          className={clsx(
            'mt-2 text-sm',
            errorMessage ? 'text-rose-600 font-semibold' : 'text-neutral-500'
          )}
        >
          {helperText}
        </p>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Meeting point suggestions"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl"
        >
          {suggestions.map((suggestion, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={suggestion.id}
                role="option"
                data-highlighted={isHighlighted ? 'true' : undefined}
                aria-selected={query === suggestion.label}
                className={clsx(
                  'cursor-pointer px-4 py-3 transition-colors',
                  isHighlighted ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                <p className="text-sm font-semibold text-neutral-900">{suggestion.label}</p>
                {suggestion.description && (
                  <p className="text-xs text-neutral-500">{suggestion.description}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MeetingPointAutocomplete;
