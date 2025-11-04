'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { BiSearch } from 'react-icons/bi';
import { differenceInDays } from 'date-fns';

import ItalyFlagIcon from '@/app/(marketplace)/utils/ItalyFlagIcon';
import useSearchModal from '@/app/(marketplace)/hooks/useSearchModal';
import useCountries from '@/app/(marketplace)/hooks/useCountries';

const Search = () => {
    const searchModal = useSearchModal();
    const params = useSearchParams();
    const { getByValue } = useCountries();

    const locationValue = params?.get('locationValue');
    const startDate = params?.get('startDate');
    const endDate = params?.get('endDate');
    const guestCount = params?.get('guestCount');

    const locationLabel = useMemo(() => {
        if (locationValue) {
            return getByValue(locationValue as string)?.label;
        }

        return 'Destination';
    }, [locationValue, getByValue]);

    // const locationLabel = useMemo(() => {
    //     const label = locationValue ? getByValue(locationValue as string)?.label : 'Italy | Rome';
      
    //     return (
    //       <span className="flex items-center gap-2">
    //         <ItalyFlagIcon />
    //         {label}
    //       </span>
    //     );
    //   }, [locationValue, getByValue]);

    const durationLabel = useMemo(() => {
        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            let diff = differenceInDays(end, start);

            if (diff === 0) {
                diff = 1;
            }

            return `${diff} Days`;
        }

        return 'Date'
    }, [startDate, endDate]);

    const guestLabel = useMemo(() => {
        if (guestCount) {
            return `${guestCount} Guests`;
        }

        return 'Guests';
    }, [guestCount]);

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
            <div
                className="
          flex 
          flex-row 
          items-center 
          justify-between
        "
            >
                <div
                    className="
            ml-2
            text-sm 
            font-medium 
            px-2
          "
                >
                    {locationLabel}
                </div>
                <div
                    className="
            hidden 
            lg:block 
            text-sm 
            font-medium 
            px-6 
            border-x-[1px] 
            flex-1 
            text-center
          "
                >
                    {durationLabel}
                </div>
                <div
                    className="
            text-sm 
            pl-6 
            pr-2 
            text-gray-600 
            flex 
            flex-row 
            items-center 
            gap-3
          "
                >
                    <div className="hidden lg:block font-medium text-black">{guestLabel}</div>
                    <div
                        className="
              p-2 
              bg-[#000]
              rounded-full 
              text-white
            "
                    >
                        <BiSearch size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Search;