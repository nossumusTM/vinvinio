'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';

import useExperienceSearchState from '@/app/hooks/useExperienceSearchState';
import useCountries from '@/app/hooks/useCountries';
import useSearchExperienceModal from '@/app/hooks/useSearchExperienceModal';

const SearchExperience = () => {
  const searchModal = useSearchExperienceModal();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { getByValue, getPopularCities } = useCountries();

  const locationValue = searchParams?.get('locationValue');
  const startDate = searchParams?.get('startDate');
  const endDate = searchParams?.get('endDate');

  const [guestCount, setGuestCount] = useState<string | null>(null);
  const { location, setLocation } = useExperienceSearchState();

  useEffect(() => {
    const g = searchParams?.get('guestCount') ?? searchParams?.get('guests');
    setGuestCount(g ?? null);
  }, [searchParams, pathname]);

  const locationFromQuery = useMemo(() => {
    if (!locationValue) return undefined;

    const popularMatch = getPopularCities().find((item) => item.value === locationValue);
    if (popularMatch) {
      return popularMatch;
    }

    const countryMatch = getByValue(locationValue);
    if (countryMatch) {
      return countryMatch;
    }

    if (locationValue.includes('-')) {
      const countryCode = locationValue.split('-').pop();
      if (countryCode) {
        const fallback = getByValue(countryCode.toUpperCase());
        if (fallback) {
          return {
            ...fallback,
            city: locationValue.replace(`-${countryCode}`, '').replace(/-/g, ' '),
            value: locationValue,
          };
        }
      }
    }

    return undefined;
  }, [locationValue, getPopularCities, getByValue]);

  useEffect(() => {
    if (!location && locationFromQuery) {
      setLocation(locationFromQuery as any);
    }
  }, [location, locationFromQuery, setLocation]);

  const activeLocation = location ?? (locationFromQuery as any);

  const locationLabel = useMemo(() => {
    const fallback = (
      <span className="pt-1 flex items-center justify-center gap-2 mr-0 md:mr-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        <Image
          src="/flags/it.svg"
          alt="Italy"
          width={16}
          height={8}
          className="rounded object-cover"
        />
        <p className="ml-1 md:ml-0">Italy</p>
      </span>
    );

    if (!activeLocation || !activeLocation.value) {
      return fallback;
    }

    const countryCode = activeLocation.value.includes('-')
      ? activeLocation.value.split('-').pop()?.toLowerCase()
      : activeLocation.value.toLowerCase();

    return (
      <span className="flex items-center gap-2 mr-0 md:mr-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        <Image
          src={`/flags/${countryCode}.svg`}
          alt={activeLocation.label}
          width={24}
          height={16}
          className="rounded-full object-cover"
        />
        {activeLocation.city ? `${activeLocation.city}, ` : ''}{activeLocation.label}
      </span>
    );
  }, [activeLocation]);

  const guestLabel = useMemo(() => {
    const count = Number(guestCount);
    if (!count || Number.isNaN(count)) return 'Add Guests';
    return `${count} ${count === 1 ? 'Guest' : 'Guests'}`;
  }, [guestCount]);

  const durationLabel = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const sameDay = start.toDateString() === end.toDateString();
      const fmt = "d MMM ''yy";

      return sameDay
        ? format(start, fmt)
        : `${format(start, 'd MMM')} – ${format(end, fmt)}`;
    }
    if (startDate) {
      return format(new Date(startDate as string), "d MMM ''yy");
    }
    return 'Select Date';
  }, [startDate, endDate]);

  return (
    <div
      onClick={searchModal.onOpen}
      className="
        sm:w-full w-auto md:w-auto
        px-2 lg:px-1 md:py-2 lg:py-2
        rounded-full
        backdrop-blur
        shadow-md hover:shadow-lg
        transition
        cursor-pointer select-none
      "
    >
      <div className="flex flex-col gap-1">
        <span className="px-2 text-[8px] uppercase tracking-[0.3em] text-neutral-500">
          Plan with intention
        </span>
        <div className="flex items-center justify-between w-full">
          <div className="flex lg:hidden flex-1 h-11">
            <div className="flex-1 h-full px-3 border-r border-neutral-200 flex items-center">
              <div className="flex flex-col items-start leading-tight w-full">
                <span className="text-[6px] uppercase tracking-wide text-neutral-500">When?</span>
                <span className="text-xs font-medium truncate">{durationLabel}</span>
              </div>
            </div>
            <div className="flex-1 h-full px-3 flex items-center">
              <div className="flex flex-col items-start leading-tight w-full">
                <span className="text-[6px] uppercase tracking-wide text-neutral-500">Who?</span>
                <span className="text-xs font-medium text-gray-700 truncate">{guestLabel}</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex ml-2 px-1 max-w-[200px]">
            <div className="flex flex-col items-start leading-tight w-full truncate">
              <span className="text-[8px] uppercase tracking-wide text-neutral-500">Where?</span>
              <div className="text-sm font-medium truncate">{locationLabel}</div>
            </div>
          </div>

          <div className="hidden lg:flex px-6 border-x flex-1 items-center">
            <div className="flex flex-col items-start leading-tight w-full">
              <span className="text-[8px] uppercase tracking-wide text-neutral-500">When?</span>
              <span className="text-sm font-medium truncate">{durationLabel}</span>
            </div>
          </div>

          <div className="hidden lg:flex pl-6 md:px-4 items-center">
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[8px] uppercase tracking-wide text-neutral-500">Who?</span>
              <span className="text-sm font-medium text-black">{guestLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchExperience;
