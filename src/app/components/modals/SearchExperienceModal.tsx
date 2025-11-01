'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import qs from 'query-string';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatISO } from 'date-fns';
import { Range } from 'react-date-range';
import { LuMapPin, LuUsers, LuCalendarDays } from 'react-icons/lu';
import type { IconType } from 'react-icons';

import Heading from '../Heading';

import useSearchExperienceModal from '@/app/hooks/useSearchExperienceModal';
import useExperienceSearchState from '@/app/hooks/useExperienceSearchState';

import Modal from './Modal';
import SearchCalendar from '../inputs/SaerchCalendar'
import CountrySearchSelect, { CountrySelectValue, CountrySearchSelectHandle } from '../inputs/CountrySearchSelect';

import Counter from '../inputs/Counter';
import useTranslations from '@/app/hooks/useTranslations';

enum STEPS {
  LOCATION = 0,
  DATE = 1,
  GUESTS = 2,
}

const SearchExperienceModal = () => {
  const router = useRouter();
  const params = useSearchParams();
  const modal = useSearchExperienceModal();
  const t = useTranslations();

  const [step, setStep] = useState(STEPS.LOCATION);
  const { location, setLocation } = useExperienceSearchState();
  const [locationError, setLocationError] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [dateRange, setDateRange] = useState<Range>({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });

  const searchInputRef = useRef<CountrySearchSelectHandle | null>(null);

  const SearchMap = useMemo(() => dynamic(() => import('../SearchMap'), {
    ssr: false
  }), [location]);

  useEffect(() => {
    if (modal.isOpen) {
      setStep(STEPS.LOCATION);
    }
  }, [modal.isOpen]);

  useEffect(() => {
    if (!modal.isOpen) {
      setLocationError(false);
    }
  }, [modal.isOpen]);

  useEffect(() => {
    if (location) {
      setLocationError(false);
    }
  }, [location]);

  const onBack = useCallback(() => setStep((val) => val - 1), []);
  const onNext = useCallback(() => setStep((val) => val + 1), []);

  const onSubmit = useCallback(() => {

    if (step === STEPS.LOCATION && !location) {
      setLocationError(true);
      searchInputRef.current?.focus();
      return;
    }

    if (step === STEPS.DATE && (!dateRange?.startDate || !dateRange?.endDate)) {
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

  // const actionLabel = useMemo(() => {
  //   if (step === STEPS.GUESTS) return 'Search';
  //   if (step === STEPS.LOCATION && !location) return 'Select a country';
  //   return 'Next';
  // }, [step, location]);

  const actionLabel = useMemo(() => {
    if (step === STEPS.GUESTS) return t('search');
    if (step === STEPS.LOCATION && !location) return 'Next destination';
    if (step === STEPS.DATE && (!dateRange?.startDate || !dateRange?.endDate)) return t('selectDates');
    return t('next');
  }, [step, location, dateRange, t]);

  const secondaryActionLabel = useMemo(
    () => (step === STEPS.LOCATION ? undefined : t('back')),
    [step, t]
  );

  const StepBadge = ({ stepIndex, label, icon: Icon }: { stepIndex: STEPS; label: string; icon: IconType; }) => (
    <div
      className={`flex items-center gap-2 px-2 py-2 md:px-4 md:py-3 rounded-2xl transition-all duration-300 border ${
        step === stepIndex ? 'bg-white/80 border-white/40 shadow-lg shadow-white/30 text-neutral-900' : 'bg-white/40 border-white/20 text-neutral-600'
      }`}
    >
      <div className={`flex h-6 w-6 md:h-8 md:w-8 items-center justify-center md:rounded-xl rounded-md ${step === stepIndex ? 'bg-black text-white' : 'bg-white text-neutral-500'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] md:text-xs uppercase tracking-wide">Step {stepIndex + 1}</span>
        <span className="text-[11px] md:text-sm font-semibold">{label}</span>
      </div>
    </div>
  );

  let bodyContent = (
    <div className="relative flex flex-col gap-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-200 via-white to-sky-200 rounded-3xl opacity-80 blur-xl" />
      <div className="flex flex-col gap-6 rounded-3xl bg-white/70 backdrop-blur p-6 shadow-xl h-fit">
        <Heading
          title="Where will your next story unfold?"
          subtitle="Choose a destination to unlock curated experiences."
        />
        <div className="flex flex-col gap-4">
          <CountrySearchSelect
            ref={searchInputRef}
            value={location}
            onChange={(value) => {
              const casted = value as CountrySelectValue | undefined;
              setLocation(casted);
              if (casted) {
                setLocationError(false);
              }
            }}
            hasError={locationError}
            onErrorCleared={() => setLocationError(false)}
          />
          <p className="text-xs text-neutral-500">
            Browse iconic cities or search for hidden gems across the globe.
          </p>
          {/* <div className="hidden md:block rounded-2xl overflow-hidden border border-white/60">
            <SearchMap city={location?.city} country={location?.label} center={location?.latlng} />
          </div> */}
          <div className="rounded-2xl overflow-hidden border border-white/60
            h-[140px] sm:h-[260px] md:h-[260px] relative">
            <div className="rounded-2xl overflow-hidden border border-white/60">
              <SearchMap
                key={`${modal.isOpen}-${location?.value ?? 'default'}`}  // force proper re-mount/center on open & change
                city={location?.city ?? 'Rome'}
                country={location?.label ?? 'Italy'}
                center={location?.latlng ?? [41.9028, 12.4964]}          // fallback center so mobile always shows a point
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap gap-3">
        <StepBadge stepIndex={STEPS.LOCATION} label={t('where')} icon={LuMapPin} />
        <StepBadge stepIndex={STEPS.DATE} label={t('when')} icon={LuCalendarDays} />
        <StepBadge stepIndex={STEPS.GUESTS} label={t('who')} icon={LuUsers} />
      </div>
    </div>
  );

  if (step === STEPS.DATE) {
    bodyContent = (
      <div className="space-y-6">
        <div className="rounded-3xl p-[1px]">
          <div className="rounded-[26px] bg-white/80 backdrop-blur p-6 shadow-xl">
            <Heading
              title="Select your travel window"
              subtitle="Choose the dates that best match your plans."
            />
            <div className="mt-4 rounded-2xl">
              <div className="flex w-full justify-center">
                <div className="w-full max-w-xs sm:max-w-md md:max-w-lg">
                  <SearchCalendar
                    value={dateRange}
                    onChange={(value) => setDateRange(value.selection)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-3">
          <StepBadge stepIndex={STEPS.LOCATION} label={t('where')} icon={LuMapPin} />
          <StepBadge stepIndex={STEPS.DATE} label={t('when')} icon={LuCalendarDays} />
          <StepBadge stepIndex={STEPS.GUESTS} label={t('who')} icon={LuUsers} />
        </div>
      </div>
    );
  }

  if (step === STEPS.GUESTS) {
    bodyContent = (
      <div className="space-y-6">
        {/* <div className="rounded-3xl bg-gradient-to-br from-amber-200 via-white to-emerald-200 p-[1px]"> */}
        <div className="rounded-3xl p-[1px]">
          <div className="rounded-[26px] bg-white/80 backdrop-blur p-6 shadow-xl">
            <Heading
              title="Who is joining the journey?"
              subtitle="Let us tailor the experience to your group size."
            />
            <div className="mt-6 rounded-2xl p-4">
              <Counter
                title={t('guestPlural')}
                subtitle={t('addGuests')}
                value={guestCount}
                onChange={(value) => setGuestCount(value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-3">
          <StepBadge stepIndex={STEPS.LOCATION} label={t('where')} icon={LuMapPin} />
          <StepBadge stepIndex={STEPS.DATE} label={t('when')} icon={LuCalendarDays} />
          <StepBadge stepIndex={STEPS.GUESTS} label={t('who')} icon={LuUsers} />
        </div>
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
      title="Craft your search"
      body={bodyContent}
      className='bg-transparent'
    />
  );
};

export default SearchExperienceModal;