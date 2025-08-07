'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { BiSearch } from 'react-icons/bi';
import { differenceInDays } from 'date-fns';
import Image from 'next/image';
import useExperienceSearchState from '@/app/hooks/useExperienceSearchState';

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

  useEffect(() => {
    setGuestCount(searchParams?.get('guests') ?? null);
  }, [searchParams, pathname]);

  const locationLabel = useMemo(() => {
    const fallback = (
      <span className="pt-1 flex items-center justify-center gap-2 mr-0 md:mr-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">

        <Image
          src="/flags/it.svg"
          alt="Italy"
          width={16}
          height={8}
          className="rounded-full object-cover rotate-45"
        />

        <p className='ml-1 md:ml-0'>
          Rome, Lazio
          </p>
      </span>
    );
  
    if (!location || !location.value) {
      return fallback;
    }
  
    const countryCode = location.value.includes('-')
      ? location.value.split('-').pop()?.toLowerCase()
      : location.value.toLowerCase();
  
    return (
      <span className="flex items-center gap-2 mr-0 md:mr-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        <Image
          src={`/flags/${countryCode}.svg`}
          alt={location.label}
          width={24}
          height={16}
          className="rounded-full object-cover"
        />
        {location.city}, {location.label}
      </span>
    );
  }, [location]);  

  const guestLabel = useMemo(() => {
    const count = Number(guestCount);
    if (!count || isNaN(count)) return 'Travellers';
    return `${count} ${count === 1 ? 'Traveller' : 'Travellers'}`;
  }, [guestCount]);
  
  const durationLabel = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      let diff = differenceInDays(end, start);
      if (diff === 0) diff = 1;
  
      return `${diff} ${diff === 1 ? 'Day' : 'Days'}`;
    }
  
    return 'Date';
  }, [startDate, endDate]);

  return (
    <div
      // onClick={searchModal.onOpen}
      onClick={searchModal.onClose}
      className="
        sm:w-full
        w-auto
        md:w-auto 
        py-2 
        md:px-1
        rounded-full 
        shadow-md 
        hover:shadow-lg 
        transition 
        cursor-pointer
      "
    >
      <div className="flex flex-row items-center justify-between">
        {/* <div className="ml-2 text-sm font-medium px-1">{locationLabel}</div> */}
        <div className="ml-2 text-sm font-medium px-1 max-w-[150px] md:max-w-[200px] truncate">{locationLabel}</div>

        <div className="hidden lg:block text-sm font-medium px-6 border-x-[1px] flex-1 text-center">
          {durationLabel}
        </div>
        <div className="text-sm pl-6 md:px-4 text-gray-600 flex flex-row items-center gap-3 ">
          <div className="hidden lg:block font-medium text-black">{guestLabel}</div>
          {/* <div className="p-2 bg-black rounded-full text-white">
            <BiSearch size={18} />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default SearchExperience;