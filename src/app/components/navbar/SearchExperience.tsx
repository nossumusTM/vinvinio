'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { PiSparkleThin } from 'react-icons/pi';
import { LuCalendarDays, LuMapPin, LuUsers } from 'react-icons/lu';

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
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
        <Image
          src="/flags/it.svg"
          alt="Italy"
          width={18}
          height={12}
          className="rounded object-cover"
        />
        <span>Italy</span>
      </div>
    );

    if (!activeLocation || !activeLocation.value) {
      return fallback;
    }

    const countryCode = activeLocation.value.includes('-')
      ? activeLocation.value.split('-').pop()?.toLowerCase()
      : activeLocation.value.toLowerCase();

    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
        <Image
          src={`/flags/${countryCode}.svg`}
          alt={activeLocation.label}
          width={18}
          height={12}
          className="rounded object-cover"
        />
        <span className="truncate max-w-[160px]">
          {activeLocation.city ? `${activeLocation.city}, ` : ''}{activeLocation.label}
        </span>
      </div>
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
    <button
      type="button"
      onClick={searchModal.onOpen}
      className="group relative w-full max-w-full rounded-3xl border border-white/60 bg-white/80 px-4 py-3 text-left shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-200/70 via-transparent to-sky-200/80 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
          <PiSparkleThin className="h-6 w-6" />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Search Experiences</span>
            <span className="hidden items-center gap-1 text-xs font-semibold text-neutral-600 sm:inline-flex">
              Plan with intention
              <span aria-hidden className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-black/5">
              <LuMapPin className="h-4 w-4 text-neutral-500" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">Where</span>
                {locationLabel}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-black/5">
              <LuCalendarDays className="h-4 w-4 text-neutral-500" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">When</span>
                <span className="truncate text-sm font-semibold text-neutral-800">{durationLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-black/5">
              <LuUsers className="h-4 w-4 text-neutral-500" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">Who</span>
                <span className="truncate text-sm font-semibold text-neutral-800">{guestLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default SearchExperience;
