'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import qs from 'query-string';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatISO } from 'date-fns';
import { Range } from 'react-date-range';
import { LuUsers, LuRocket } from 'react-icons/lu';
import { FcIdea } from "react-icons/fc";
import { GiWideArrowDunk } from "react-icons/gi";
import { FaLocationArrow } from "react-icons/fa6";
import { LiaLocationArrowSolid } from "react-icons/lia";
import { CgCalendarDates } from "react-icons/cg";
import { FaPeoplePulling } from "react-icons/fa6";
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import type { IconType } from 'react-icons';
import clsx from 'clsx';

import Heading from '../Heading';

import useSearchExperienceModal from '@/app/(marketplace)/hooks/useSearchExperienceModal';
import useExperienceSearchState from '@/app/(marketplace)/hooks/useExperienceSearchState';

import Modal from './Modal';
import SearchCalendar from '../inputs/SearchCalendar';
import CountrySearchSelect, { CountrySearchSelectHandle } from '../inputs/CountrySearchSelect';

import Counter from '../inputs/Counter';
import useTranslations from '@/app/(marketplace)/hooks/useTranslations';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import VinAiSearchWidget from '../VinAiSearchWidget';
import VinAiChatView from '../VinAiChatView';
import toast from 'react-hot-toast';

enum STEPS {
  AI = 0,
  LOCATION = 1,
  DATE = 2,
  GUESTS = 3,
}

const SearchExperienceModal = () => {
  const router = useRouter();
  const params = useSearchParams();
  const modal = useSearchExperienceModal();
  const t = useTranslations();

  const [step, setStep] = useState(STEPS.AI);
  const [isAiFullscreen, setIsAiFullscreen] = useState(false);
  const { location, setLocation } = useExperienceSearchState();
  const [locationError, setLocationError] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [dateRange, setDateRange] = useState<Range>({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });

  const searchInputRef = useRef<CountrySearchSelectHandle | null>(null);
  const wasAiFullscreen = useRef(false);
  const [dir, setDir] = useState<1 | -1>(1);

  const STEP_VARIANTS: Variants = {
    initial: (d: 1 | -1) => ({ opacity: 0, x: d > 0 ? 40 : -40, scale: 0.98 }),
    animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 32, mass: 0.4 } },
    exit:    (d: 1 | -1) => ({ opacity: 0, x: d > 0 ? -40 : 40, scale: 0.98, transition: { duration: 0.18 } }),
  };

  const SearchMap = useMemo(
    () => dynamic(() => import('../SearchMap'), { ssr: false }),
    [],
  );

  useEffect(() => {
    if (modal.isOpen) {
      setStep(STEPS.AI);
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

  const onBack = useCallback(() => {
    setDir(-1);
    setStep((val) => val - 1);
  }, []);
  const onNext = useCallback(() => {
    setDir(1);
    setStep((val) => val + 1);
  }, []);

  const handleFullscreenExit = useCallback(() => {
    setStep(STEPS.AI);
    setIsAiFullscreen(false);
    modal.onOpen();
  }, [modal]);

  const onSubmit = useCallback(() => {

    if (step === STEPS.AI) {
      onNext();
      return;
    }

    if (step === STEPS.LOCATION && !location) {
      setLocationError(true);
      searchInputRef.current?.focus();
      return;
    }

    if (step === STEPS.DATE && (!dateRange?.startDate || !dateRange?.endDate)) {
      return;
    }

    if (step !== STEPS.GUESTS) {
      onNext();
      return;
    }

    const currentQuery = params ? (qs.parse(params.toString()) as qs.StringifiableRecord) : {};
    const updatedQuery: qs.StringifiableRecord = { ...currentQuery };

    if (location?.value) {
      updatedQuery.locationValue = location.value;
    }

    if (guestCount) {
      updatedQuery.guestCount = guestCount;
    }

    if (dateRange.startDate) {
      updatedQuery.startDate = formatISO(dateRange.startDate);
    }

    if (dateRange.endDate) {
      updatedQuery.endDate = formatISO(dateRange.endDate);
    }

    setLocation(location);
    // modal.onClose();
    setStep(STEPS.AI);
    router.push(qs.stringifyUrl({ url: '/', query: updatedQuery }, { skipNull: true }));

    modal.onClose();
  }, [dateRange.endDate, dateRange.startDate, guestCount, location, modal, onNext, params, router, setLocation, step]);

  const actionLabel = useMemo(() => {
    if (step === STEPS.GUESTS) return t('search');
    if (step === STEPS.AI) return '';
    if (step === STEPS.LOCATION && !location) return 'Choose a destination';
    if (step === STEPS.DATE && (!dateRange?.startDate || !dateRange?.endDate)) return t('selectDates');
    return t('next');
  }, [dateRange, location, step, t]);

  const secondaryActionLabel = useMemo(
    () => (step === STEPS.AI ? undefined : t('back')),
    [step, t]
  );

  const StepBadge = ({
    stepIndex,
    label,
    icon: Icon,
  }: {
    stepIndex: STEPS;
    label: string;
    icon: IconType;
  }) => {
    const isActive = step === stepIndex;
    const handleClick = () => {
      if (step === stepIndex) return;
      setDir(stepIndex > step ? 1 : -1);
      setStep(stepIndex);
    };

    return (
      <div
        className={clsx(
          'flex items-center gap-2 rounded-2xl border px-2 py-2 transition-all duration-300 md:px-4 md:py-3',
          isActive
            ? 'bg-white/80 border-white/40 text-neutral-900 shadow-md'
            : 'bg-white/40 border-white/20 text-neutral-600 shadow-sm hover:border-white/40 hover:bg-white/60 cursor-pointer',
        )}
        onClick={handleClick}
      >
        <div
          className={clsx(
            'flex h-6 w-6 items-center justify-center rounded-md md:h-8 md:w-8 md:rounded-xl',
            isActive ? 'bg-black text-white' : 'bg-white text-neutral-500',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide md:text-xs">Step {stepIndex + 1}</span>
          <span className="text-[11px] font-semibold md:text-sm">{label}</span>
        </div>
      </div>
    );
  };

  let bodyContent: React.ReactNode = null;

  if (step === STEPS.AI) {
    bodyContent = (
      <div className="space-y-6">
        <div className="rounded-3xl p-[1px]">
          <div className="rounded-[26px] bg-white/80 backdrop-blur p-6 shadow-xl">
            <VinAiSearchWidget
              onSkip={onSubmit}
              isModalOpen={modal.isOpen}
              onExpand={() => {
                modal.onClose();
                setIsAiFullscreen(true);
              }}
            />
          </div>
        </div>
        {/* <div className="flex flex-row flex-wrap gap-3 justify-center mt-2"> */}
          {/* <StepBadge stepIndex={STEPS.AI} label="AI Force" icon={LuRocket} /> */}
          {/* <StepBadge stepIndex={STEPS.LOCATION} label={t('where')} icon={FaLocationArrow} />
          <StepBadge stepIndex={STEPS.DATE} label={t('when')} icon={CgCalendarDates} />
          <StepBadge stepIndex={STEPS.GUESTS} label={t('who')} icon={FaPeoplePulling} /> */}
        {/* </div> */}
      </div>
      
    );
  }

  if (step === STEPS.LOCATION) {
    bodyContent = (
      <div className="relative flex flex-col gap-8">
        <div className="absolute inset-0 -z-10 rounded-3xl opacity-80 blur-xl" />
        <div className="flex flex-col gap-6 rounded-3xl bg-white/70 backdrop-blur p-6 shadow-xl h-fit">
          <div className="relative z-30 flex flex-col gap-4">
            <CountrySearchSelect
              ref={searchInputRef}
              value={location}
              onChange={(value) => {
                setLocation(value);
                if (value) {
                  setLocationError(false);
                }
              }}
              hasError={locationError}
              onErrorCleared={() => setLocationError(false)}
            />
            <p className="text-xs text-neutral-500">
              Browse iconic cities or search for hidden gems across the globe.
            </p>
            <div className="relative z-0 h-[140px] overflow-hidden rounded-2xl border border-white/60 sm:h-[260px] md:h-[260px]">
              <SearchMap
                key={`${modal.isOpen}-${location?.value ?? 'default'}`}
                city={location?.city ?? 'Rome'}
                country={location?.label ?? 'Italy'}
                center={(location?.latlng as [number, number]) ?? ([41.9028, 12.4964] as [number, number])}
                allowFullscreen
              />
            </div>
          </div>
        </div>
        <div className="ml-1 flex flex-row flex-wrap gap-3 justify-center mt-2">
          {/* <StepBadge stepIndex={STEPS.AI} label="AI Force" icon={LuRocket} /> */}
          <StepBadge stepIndex={STEPS.LOCATION} label={t('where')} icon={FaLocationArrow} />
          <StepBadge stepIndex={STEPS.DATE} label={t('when')} icon={CgCalendarDates} />
          <StepBadge stepIndex={STEPS.GUESTS} label={t('who')} icon={FaPeoplePulling} />
        </div>
      </div>
    );
  }

  if (step === STEPS.DATE) {
    bodyContent = (
      <div className="space-y-6">
        <div className="rounded-3xl p-[1px]">
          <div className="rounded-[26px] bg-white/80 backdrop-blur">
            {/* <Heading
              title="Select your travel window"
              subtitle="Choose the dates that best match your plans."
            /> */}
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
        <div className="flex flex-row flex-wrap gap-3 justify-center mt-2">
          {/* <StepBadge stepIndex={STEPS.AI} label="AI Force" icon={LuRocket} /> */}
          <StepBadge stepIndex={STEPS.LOCATION} label={t('where')} icon={FaLocationArrow} />
          <StepBadge stepIndex={STEPS.DATE} label={t('when')} icon={CgCalendarDates} />
          <StepBadge stepIndex={STEPS.GUESTS} label={t('who')} icon={FaPeoplePulling} />
        </div>
      </div>
    );
  }

  if (step === STEPS.GUESTS) {
    bodyContent = (
      <div className="space-y-6 mt-6">
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
        <div className="flex flex-row flex-wrap gap-3 justify-center mt-2">
          {/* <StepBadge stepIndex={STEPS.AI} label="AI Force" icon={LuRocket} /> */}
          <StepBadge stepIndex={STEPS.LOCATION} label={t('where')} icon={FaLocationArrow} />
          <StepBadge stepIndex={STEPS.DATE} label={t('when')} icon={CgCalendarDates} />
          <StepBadge stepIndex={STEPS.GUESTS} label={t('who')} icon={FaPeoplePulling} />
        </div>
      </div>
    );
  }

  return (
     <>
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onSubmit={onSubmit}
        submitOnEnter={step !== STEPS.AI}
        actionLabel={actionLabel}
        secondaryActionLabel={secondaryActionLabel}
        secondaryAction={step === STEPS.AI ? undefined : onBack}
        title="Explore your destination"
        className="bg-transparent"
        body={
          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                custom={dir}
                variants={STEP_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {bodyContent}
              </motion.div>
            </AnimatePresence>
          </div>
        }
      />
      <AnimatePresence>
        {isAiFullscreen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.84 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full w-full origin-bottom-right overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <VinAiChatView
                onBack={handleFullscreenExit}
                isFullscreen
                onClose={handleFullscreenExit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchExperienceModal;
