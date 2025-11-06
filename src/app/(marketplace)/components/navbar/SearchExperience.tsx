'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { LuMapPin } from 'react-icons/lu';

import useExperienceSearchState from '@/app/(marketplace)/hooks/useExperienceSearchState';
import useSearchExperienceModal from '@/app/(marketplace)/hooks/useSearchExperienceModal';

const SearchExperience = () => {
  const searchModal = useSearchExperienceModal();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { location } = useExperienceSearchState();

  const startDate = searchParams?.get('startDate');
  const endDate = searchParams?.get('endDate');

  const [guestCount, setGuestCount] = useState<string | null>(null);

  useEffect(() => {
    const g = searchParams?.get('guestCount') ?? searchParams?.get('guests');
    setGuestCount(g ?? null);
  }, [pathname, searchParams]);

  const locationLabel = useMemo(() => {
    if (!location || !location.value) {
      return (
        <span className="flex items-center gap-1 text-sm font-semibold text-neutral-700">
          <LuMapPin className="h-4 w-4" aria-hidden="true" />
          Take Me There
        </span>
      );
    }

    const countryCode = location.value.includes('-')
      ? location.value.split('-').pop()?.toLowerCase()
      : location.value.toLowerCase();

    return (
      <span className="flex items-center gap-1.5 ml-0.5 whitespace-nowrap">
        <Image
          src={`/flags/${countryCode}.svg`}
          alt={location.label}
          width={16}
          height={12}
          className="p-1 shadow-md rounded-md object-cover"
        />
        {location.city}, {location.label}
      </span>
    );
  }, [location]);

  const guestLabel = useMemo(() => {
    const count = Number(guestCount);
    if (!count || Number.isNaN(count)) {
      return 'Let’s Go!';
    }
    return `${count} ${count === 1 ? 'Guest' : 'Guests'}`;
  }, [guestCount]);

  const durationLabel = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const sameDay = start.toDateString() === end.toDateString();
      const formatToken = "d MMM ''yy";

      return sameDay
        ? format(start, formatToken)
        : `${format(start, 'd MMM')} – ${format(end, formatToken)}`;
    }

    if (startDate) {
      return format(new Date(startDate), "d MMM ''yy");
    }

    return 'Right Now';
  }, [endDate, startDate]);

  return (
    <button
      type="button"
      onClick={searchModal.onOpen}
      className="flex w-full cursor-pointer select-none items-center justify-between rounded-full px-3 py-2 shadow-md backdrop-blur transition hover:shadow-lg md:w-auto lg:px-4"
    >
      <div className="flex flex-1 items-center justify-between lg:hidden">
        <div className="flex flex-1 items-center border-r border-neutral-200 px-3">
          <div className="flex w-full flex-col items-start leading-tight">
            <span className="text-[6px] uppercase tracking-wide text-neutral-500">When?</span>
            <span className="text-xs font-medium truncate">{durationLabel}</span>
          </div>
        </div>
        <div className="flex flex-1 items-center px-3">
          <div className="flex w-full flex-col items-start leading-tight">
            <span className="text-[6px] uppercase tracking-wide text-neutral-500">Who?</span>
            <span className="text-xs font-medium text-gray-700 truncate">{guestLabel}</span>
          </div>
        </div>
      </div>

      <div className="hidden w-full items-center gap-6 lg:flex">
        <div className="flex min-w-[100px] flex-col items-start leading-tight">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">Where?</span>
          <div className="text-sm font-medium text-neutral-900">{locationLabel}</div>
        </div>
        <div className="flex flex-1 flex-col items-start border-x border-neutral-200 px-6 leading-tight">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">When?</span>
          <span className="text-sm font-medium">{durationLabel}</span>
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">Who?</span>
          <span className="text-sm font-medium text-neutral-900">{guestLabel}</span>
        </div>
      </div>
    </button>
  );
};

export default SearchExperience;

