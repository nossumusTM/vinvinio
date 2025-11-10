'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { LuMapPin } from 'react-icons/lu';

import useExperienceSearchState from '@/app/(marketplace)/hooks/useExperienceSearchState';
import useSearchExperienceModal from '@/app/(marketplace)/hooks/useSearchExperienceModal';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import useCountries from '@/app/(marketplace)/hooks/useCountries';

const SearchExperience = () => {
  const searchModal = useSearchExperienceModal();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { location } = useExperienceSearchState();

  const startDate = searchParams?.get('startDate');
  const endDate = searchParams?.get('endDate');

  const [guestCount, setGuestCount] = useState<string | null>(null);

  const { getAll } = useCountries();
  const countrySuggestions = useMemo(() => getAll(), [getAll]);

  const TEXT_STYLE = "text-sm font-medium";
  const SAFETY_PAD = 8; // px buffer to avoid last-letter clipping

   const ROTATING_ITEMS = [
    'Rome, Italy',
    'Hong Kong, China',
    'Baku, Azerbaijan',
    'Paris, France',
    'Istanbul, Turkey',
    'Tokyo, Japan',
    'Barcelona, Spain',
  ];

  const norm = (s: string) =>
    s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/türkiye|turkiye/g, 'turkey').trim();
  const extractCountryFromText = (text: string) => {
    const parts = text.split(',');
    return norm(parts[parts.length - 1] || '');
  };

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [measureText, setMeasureText] = useState(ROTATING_ITEMS[0]);

  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [labelW, setLabelW] = useState(0);

  // rotate items as you already did
  // useEffect(() => {
  //   const id = setInterval(() => {
  //     setPlaceholderIndex((i) => (i + 1) % ROTATING_ITEMS.length);
  //   }, 3800);
  //   return () => clearInterval(id);
  // }, []);

  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let id: number, raf1: number, raf2: number;
    const tick = () => {
      const next = (placeholderIndex + 1) % ROTATING_ITEMS.length;
      setMeasureText(ROTATING_ITEMS[next]);              // measure NEXT first
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setPlaceholderIndex(next);                    // then show it
          id = window.setTimeout(tick, 4200);
        });
      });
    };
    id = window.setTimeout(tick, 4200);
    return () => { clearTimeout(id); cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [placeholderIndex]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? el.offsetWidth;
      setLabelW(Math.ceil(w) + 2); // +2px safety to avoid last-letter clip
    });
    ro.observe(el);
    setLabelW(Math.ceil(el.offsetWidth) + 2);
    return () => ro.disconnect();
  }, [measureText]); // <-- measure when "next" text changes

  const displayedFlagCode = useMemo(() => {
    // if user already selected a location → use it
    if (location?.value) {
      const parts = location.value.toLowerCase().split('-');
      return parts[parts.length - 1]; // e.g. "rome-it" → "it"
    }

    // otherwise derive country from rotating text
    const rotating = ROTATING_ITEMS[placeholderIndex];
    const countryLower = extractCountryFromText(rotating);

    const match = countrySuggestions.find(
      (c) => norm(c.label) === countryLower
    );

    return match?.value?.toLowerCase() ?? 'globe';
  }, [location?.value, placeholderIndex, countrySuggestions]);

  const rotatingVariants: Variants = {
    hidden:  { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0,  transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] } },
    exit:    { opacity: 0, y: 6,  transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] } },
  };

  useEffect(() => {
    const g = searchParams?.get('guestCount') ?? searchParams?.get('guests');
    setGuestCount(g ?? null);
  }, [pathname, searchParams]);

  const locationLabel = useMemo(() => {
    if (!location || !location.value) {
     return (
      <>
        {/* hidden measurer (offscreen) to get exact width of current label */}
        <span
          ref={measureRef}
          className={`absolute -left-[9999px] top-0 whitespace-nowrap ${TEXT_STYLE}`}
        >
          {measureText}
        </span>

        <span className="flex items-center gap-1.5 text-neutral-700">
          <Image
            key={displayedFlagCode}
            src={`/flags/${displayedFlagCode}.svg`}
            alt="Explore destinations"
            width={16}
            height={12}
            className="ml-0.5 h-4 w-6 rounded object-cover"
          />

          {/* animate container to measured width */}
          <motion.div
           className={`relative h-5 overflow-hidden whitespace-nowrap ${TEXT_STYLE}`}
           style={{ width: labelW + SAFETY_PAD }}
           animate={{ width: labelW + SAFETY_PAD }}
           initial={false}
           transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.35 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={placeholderIndex}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={rotatingVariants}
                className="block whitespace-nowrap"
              >
                {ROTATING_ITEMS[placeholderIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </span>
      </>
    );
    }

    const countryCode = location.value.includes('-')
      ? location.value.split('-').pop()?.toLowerCase()
      : location.value.toLowerCase();

    const locationText = location.city ? `${location.city}, ${location.label}` : location.label;

    return (
      <span className="flex items-center gap-1.5 ml-0.5 whitespace-nowrap">
        <Image
          src={`/flags/${countryCode}.svg`}
          alt={location.label}
          width={16}
          height={12}
          className="h-4 w-6 rounded object-cover"
        />
        {/* {location.city}, {location.label} */}
        {locationText}
      </span>
    );
  }, [location, placeholderIndex, displayedFlagCode, labelW, measureText]);

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
    <motion.button
          type="button"
          onClick={searchModal.onOpen}
          className="flex w-full cursor-pointer select-none items-center justify-between rounded-full px-3 py-2 shadow-md backdrop-blur transition hover:shadow-lg md:w-auto lg:px-4"
          layout
          transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.4 }}
        >
      <div className="flex flex-1 items-center justify-between lg:hidden">
        <div className="flex flex-1 items-center border-r border-neutral-200 px-3">
          <div className="flex w-full flex-col items-start leading-tight">
            <span className="text-[6px] uppercase tracking-wide text-neutral-500">When?</span>
            <span className="text-xs font-medium text-neutral-700 truncate">{durationLabel}</span>
          </div>
        </div>
        <div className="flex flex-1 items-center px-3">
          <div className="flex w-full flex-col items-start leading-tight">
            <span className="text-[6px] uppercase tracking-wide text-neutral-500">Who?</span>
            <span className="text-xs font-medium text-neutral-700 truncate">{guestLabel}</span>
          </div>
        </div>
      </div>

      <div className="hidden w-full items-center gap-6 lg:flex">
        <motion.div layout className="flex min-w-[100px] flex-col items-start leading-tight overflow-hidden">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">Where?</span>
          <div className="text-neutral-900">{locationLabel}</div>
        </motion.div>
        <div className="flex flex-1 flex-col items-start border-x border-neutral-200 px-6 leading-tight">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">When?</span>
          <span className="text-sm font-medium">{durationLabel}</span>
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[8px] uppercase tracking-wide text-neutral-500">Who?</span>
          <span className="text-sm font-medium text-neutral-900">{guestLabel}</span>
        </div>
      </div>
    </motion.button>
  );
};

export default SearchExperience;

