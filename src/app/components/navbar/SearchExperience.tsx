'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import useExperienceSearchState from '@/app/hooks/useExperienceSearchState';
import { LuMapPin } from 'react-icons/lu';

import useCountries from '@/app/hooks/useCountries';
import useSearchExperienceModal from '@/app/hooks/useSearchExperienceModal';

const SearchExperience = () => {
  const searchModal = useSearchExperienceModal();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // const params = useSearchParams();
  const { getByValue } = useCountries();

  const locationValue = searchParams?.get('locationValue');
  const startDate = searchParams?.get('startDate');
  const endDate = searchParams?.get('endDate');
  // const guestCount = params?.get('guestCount');

  const [guestCount, setGuestCount] = useState<string | null>(null);

  // const locationLabel = useMemo(() => {
  //   const location = locationValue ? getByValue(locationValue) : null;

  //   const flag = location?.flag ?? '🇮🇹';
  //   const city = location?.city ?? 'Rome';
  //   const country = location?.label ?? 'Italy';

  //   return (
  //     <span className="flex items-center gap-2">
  //       <span>{flag}</span>
  //       {city}, {country}
  //     </span>
  //   );
  // }, [locationValue, getByValue]);

  const { location } = useExperienceSearchState();

  // const locationLabel = useMemo(() => {
  //   if (!location) {
  //     return (
  //       <span className="flex items-center gap-2 mr-0 md:mr-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
  //         <Image
  //           src="/flags/it.svg"
  //           alt="Italy"
  //           width={24}
  //           height={16}
  //           className="rounded-full object-cover"
  //         />
  //         Rome, Italy
  //       </span>
  //     );
  //   }
  
  //   if (location && location.value) {
  //     const countryCode = location.value.includes('-')
  //       ? location.value.split('-').pop()?.toLowerCase()
  //       : location.value.toLowerCase();
    
  //     return (
  //       <span className="flex items-center gap-2 mr-0 md:mr-3">
  //         <Image
  //           src={`/flags/${countryCode}.svg`}
  //           alt={location.label}
  //           width={24}
  //           height={16}
  //           className="rounded-full object-cover"
  //         />
  //         {location.city}, {location.label}
  //       </span>
  //     );
  //   }    
  // }, [location]);

  // useEffect(() => {
  //   setGuestCount(searchParams?.get('guests') ?? null);
  // }, [searchParams, pathname]);

  // useEffect(() => {
  //   const gc =
  //     searchParams?.get('guestCount') ??
  //     searchParams?.get('guests');

  //   setGuestCount(gc && gc.trim() !== '' ? gc : null);
  // }, [searchParams, pathname]);

  useEffect(() => {
    const g = searchParams?.get('guestCount') ?? searchParams?.get('guests');
    setGuestCount(g ?? null);
  }, [searchParams, pathname]);

  const locationLabel = useMemo(() => {
    if (!location || !location.value) {
      return (
        <span className="flex items-center gap-1 mr-0 md:mr-5 text-sm font-medium">
          <LuMapPin className="h-4 w-4" aria-hidden="true" />
          Take Me There
        </span>
      );
    }

    const countryCode = location.value.includes('-')
      ? location.value.split('-').pop()?.toLowerCase()
      : location.value.toLowerCase();

    return (
      <span className="flex items-center gap-2 mr-0 md:mr-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        <Image
          src={`/flags/${countryCode}.svg`}
          alt={location.label}
          width={14}
          height={6}
          className="ml-0.5 rounded-sm object-cover"
        />
        {location.city}, {location.label}
      </span>
    );
  }, [location]);  

  const guestLabel = useMemo(() => {
    const count = Number(guestCount);
    if (!count || isNaN(count)) return 'Count Me In';
    return `${count} ${count === 1 ? 'Guest' : 'Guests'}`;
  }, [guestCount]);
  
  // const durationLabel = useMemo(() => {
  //   if (startDate && endDate) {
  //     const start = new Date(startDate as string);
  //     const end = new Date(endDate as string);
  //     let diff = differenceInDays(end, start);
  //     if (diff === 0) diff = 1;
  
  //     return `${diff} ${diff === 1 ? 'Day' : 'Days'}`;
  //   }
  
  //   return 'Date';
  // }, [startDate, endDate]);

  const durationLabel = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const sameDay = start.toDateString() === end.toDateString();
      const fmt = "d MMM ''yy";

      return sameDay
        ? format(start, fmt)                              // e.g., 31 Oct '25
        : `${format(start, "d MMM")} – ${format(end, fmt)}`; // e.g., 31 Oct – 02 Nov '25
    }
    if (startDate) {
      return format(new Date(startDate as string), "d MMM ''yy");
    }
    return 'Right Now';
  }, [startDate, endDate]);

  return (
    <div
      onClick={searchModal.onOpen}
      // onClick={searchModal.onClose}
      // className="
      //   sm:w-full
      //   w-auto
      //   md:w-auto 
      //   py-2 
      //   md:px-1
      //   rounded-full 
      //   shadow-md 
      //   hover:shadow-lg 
      //   transition 
      //   cursor-pointer
      //   select-none
      // "
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
      <div className="flex items-center justify-between w-full">

      {/* MOBILE: Date | Guests (side by side, compact) */}
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

      {/* DESKTOP: Location */}
      <div className="hidden lg:flex ml-2 px-1 max-w-[200px]">
        <div className="flex flex-col items-start leading-tight w-full truncate">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">Where?</span>
          <div className="text-sm font-medium truncate">{locationLabel}</div>
        </div>
      </div>


      {/* DESKTOP: Date */}
      <div className="hidden lg:flex px-6 border-x flex-1 items-center">
        <div className="flex flex-col items-start leading-tight w-full">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">When?</span>
          <span className="text-sm font-medium truncate">{durationLabel}</span>
        </div>
      </div>

      {/* DESKTOP: Guests */}
      <div className="hidden lg:flex pl-6 md:px-4 items-center">
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">Who?</span>
          <span className="text-sm font-medium text-black">{guestLabel}</span>
        </div>
      </div>
    </div>

    </div>
  );
};

export default SearchExperience;