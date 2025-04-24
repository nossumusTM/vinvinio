'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import qs from 'query-string';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatISO } from 'date-fns';
import { Range } from 'react-date-range';
import Heading from '../Heading';

import useSearchExperienceModal from '@/app/hooks/useSearchExperienceModal';
import useExperienceSearchState from '@/app/hooks/useExperienceSearchState';
import useCountries from '@/app/hooks/useCountries';

import Modal from './Modal';
import Calendar from '../inputs/Calendar';
import SearchCalendar from '../inputs/SaerchCalendar'
// import CountrySelect, { CountrySelectValue } from '../inputs/CountrySelect';
import CountrySearchSelect, { CountrySelectValue } from '../inputs/CountrySearchSelect';

import Counter from '../inputs/Counter';

enum STEPS {
  LOCATION = 0,
  DATE = 1,
  GUESTS = 2,
}

const SearchExperienceModal = () => {
  const router = useRouter();
  const params = useSearchParams();
  const modal = useSearchExperienceModal();
  const { getByValue } = useCountries();

  const [step, setStep] = useState(STEPS.LOCATION);
//   const [location, setLocation] = useState<CountrySelectValue>();
  const { location, setLocation } = useExperienceSearchState();
  const [guestCount, setGuestCount] = useState(1);
  const [dateRange, setDateRange] = useState<Range>({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });

  const SearchMap = useMemo(() => dynamic(() => import('../SearchMap'), {
    ssr: false
  }), [location]);

  const onBack = useCallback(() => setStep((val) => val - 1), []);
  const onNext = useCallback(() => setStep((val) => val + 1), []);

  const onSubmit = useCallback(() => {

    if (step === STEPS.LOCATION && !location) {
        return;
      }

    if (step !== STEPS.GUESTS) {
      return onNext();
    }
  
    let currentQuery = {};
    if (params) currentQuery = qs.parse(params.toString());
  
    const updatedQuery: any = {
      ...currentQuery,
      locationValue: location?.value,
      guestCount,
    };
  
    if (dateRange.startDate) {
      updatedQuery.startDate = formatISO(dateRange.startDate);
    }
  
    if (dateRange.endDate) {
      updatedQuery.endDate = formatISO(dateRange.endDate);
    }
  
    // ✅ persist selected location in global store
    setLocation(location as any);
  
    modal.onClose();
    setStep(STEPS.LOCATION);
    router.push(qs.stringifyUrl({ url: '/', query: updatedQuery }, { skipNull: true }));
  }, [step, modal, location, guestCount, dateRange, router, params, onNext, setLocation]);

  const actionLabel = useMemo(() => {
    if (step === STEPS.GUESTS) return 'Search';
    if (step === STEPS.LOCATION && !location) return 'Select a country';
    return 'Next';
  }, [step, location]);

  const secondaryActionLabel = useMemo(() => step === STEPS.LOCATION ? undefined : 'Back', [step]);

  let bodyContent = (
    <div className="flex flex-col gap-8 max-h-[50vh] overflow-y-auto sm:max-h-none">
        <Heading
            title="Where do you wanna go?"
            subtitle="Find the perfect location!"
          />
      <CountrySearchSelect
        value={location}
        onChange={(value) => setLocation(value as CountrySelectValue)}
      />
      <hr />
      <SearchMap city={location?.city} country={location?.label} center={location?.latlng} />
    </div>
  );

  if (step === STEPS.DATE) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <SearchCalendar
          value={dateRange}
          onChange={(value) => setDateRange(value.selection)}
        />
      </div>
    );
  }

  if (step === STEPS.GUESTS) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Counter
          title="Travellers"
          subtitle="How many people are going?"
          value={guestCount}
          onChange={(value) => setGuestCount(value)}
        />
      </div>
    );
  }

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={modal.onClose}
      onSubmit={onSubmit}
      actionLabel={actionLabel}
      secondaryActionLabel={secondaryActionLabel}
      secondaryAction={step === STEPS.LOCATION ? undefined : onBack}
      title="Start your experience"
      body={bodyContent}
      className=''
    />
  );
};

export default SearchExperienceModal;