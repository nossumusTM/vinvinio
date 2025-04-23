'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { BiSearch } from 'react-icons/bi';
import { differenceInDays } from 'date-fns';
import Image from 'next/image';
import useExperienceSearchState from '@/app/hooks/useExperienceSearchState';

import useCountries from '@/app/hooks/useCountries';
import useSearchExperienceModal from '@/app/hooks/useSearchExperienceModal';

const SearchExperience = () => {
  const searchModal = useSearchExperienceModal();
  const params = useSearchParams();
  const { getByValue } = useCountries();

  const locationValue = params?.get('locationValue');
  const startDate = params?.get('startDate');
  const endDate = params?.get('endDate');
  const guestCount = params?.get('guestCount');

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

  const locationLabel = useMemo(() => {
    const fallback = (
      <span className="flex items-center gap-2 mr-0 md:mr-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        <Image
          src="/flags/it.svg"
          alt="Italy"
          width={24}
          height={16}
          className="rounded-full object-cover"
        />
        <p className='ml-1 md:ml-0'>
          Rome, Italy
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
  
    return 'Pick a Date';
  }, [startDate, endDate]);

  return (
    <div
      onClick={searchModal.onOpen}
      className="
        w-full 
        md:w-auto 
        py-2 
        rounded-full 
        shadow-md 
        hover:shadow-lg 
        transition 
        cursor-pointer
      "
    >
      <div className="flex flex-row items-center justify-between">
        {/* <div className="ml-2 text-sm font-medium px-1">{locationLabel}</div> */}
        <div className="ml-2 text-sm font-medium px-1 max-w-[150px] truncate">{locationLabel}</div>

        <div className="hidden lg:block text-sm font-medium px-6 border-x-[1px] flex-1 text-center">
          {durationLabel}
        </div>
        <div className="text-sm pl-6 pr-2 text-gray-600 flex flex-row items-center gap-3">
          <div className="hidden lg:block font-medium text-black">{guestLabel}</div>
          <div className="p-2 bg-black rounded-full text-white">
            <BiSearch size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchExperience;