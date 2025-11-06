'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryBox from '../CategoryBox';
import Container from '../Container';
import axios from 'axios';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  LuBaby,
  LuCompass,
  LuBriefcase,
  LuBus,
  LuChevronUp,
  LuChevronLeft,
  LuDumbbell,
  LuGem,
  LuGraduationCap,
  LuHeart,
  LuHelpingHand,
  LuLandmark,
  LuFlower2,
  LuMountain,
  LuMusic2,
  LuPalette,
  LuPartyPopper,
  LuSlidersHorizontal,
  LuUtensils,
  LuWaves,
  LuLeaf,
  LuSearch,
  LuLanguages,
  LuTag,
  LuLoader2,
  LuUsers,
  LuClock3,
  LuGlobe2,
  LuActivity,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import qs, {
  type ParsedQuery,
  type StringifiableRecord,
} from 'query-string';
import {
  ACTIVITY_FORM_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GROUP_STYLE_OPTIONS,
} from '@/app/(marketplace)/constants/experienceFilters';
import CountrySearchSelect, {
  type CountrySelectValue,
  type CountrySearchSelectHandle,
} from '../inputs/CountrySearchSelect';
import useExperienceSearchState from '@/app/(marketplace)/hooks/useExperienceSearchState';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import { LANGUAGE_OPTIONS } from '@/app/(marketplace)/constants/locale';

declare global {
  interface WindowEventMap {
    'categories:open': CustomEvent<void>;
  }
}

type CategoryDefinition = {
  label: string;
  icon: IconType;
  description: string;
};

type FiltersState = {
  groupStyles: string[];
  duration: string | null;
  environments: string[];
  activityForms: string[];
  languages: string[];
  keywords: string[];
};

export const categories: CategoryDefinition[] = [
  {
    label: 'Adventure & Outdoor',
    icon: LuMountain,
    description: 'Thrilling experiences in the open air, from hiking trails to adrenaline adventures.',
  },
  {
    label: 'Nature & Wildlife',
    icon: LuLeaf,
    description: 'Explore biodiversity and connect with the natural world and its habitats.',
  },
  {
    label: 'Water Activities',
    icon: LuWaves,
    description: 'Sail, swim, and dive into aquatic adventures above and below the surface.',
  },
  {
    label: 'Food, Drinks & Culinary',
    icon: LuUtensils,
    description: 'Taste, sip, and cook your way through immersive culinary journeys.',
  },
  {
    label: 'Culture & History',
    icon: LuLandmark,
    description: 'Discover local heritage, stories, and iconic landmarks with expert hosts.',
  },
  {
    label: 'Art, Design & Photography',
    icon: LuPalette,
    description: 'Creative workshops and visual explorations for art and design lovers.',
  },
  {
    label: 'Music, Nightlife & Social',
    icon: LuMusic2,
    description: 'Groove through vibrant nights, live performances, and social hangouts.',
  },
  {
    label: 'Sports, Fitness & Well-Being',
    icon: LuDumbbell,
    description: 'Active escapes focused on movement, health, and mindful balance.',
  },
  {
    label: 'Workshops & Skill-Learning',
    icon: LuGraduationCap,
    description: 'Hands-on classes to master new crafts, skills, and creative passions.',
  },
  {
    label: 'Tours & Sightseeing',
    icon: LuCompass,
    description: 'Guided explorations that uncover hidden gems and iconic views.',
  },
  {
    label: 'Luxury, VIP & Exclusive Access',
    icon: LuGem,
    description: 'Premium experiences with special access and elevated service.',
  },
  {
    label: 'Spirituality, Retreats & Healing',
    icon: LuFlower2,
    description: 'Restorative journeys for mindfulness, wellness, and inner balance.',
  },
  {
    label: 'Transportation & Logistics',
    icon: LuBus,
    description: 'Seamless mobility services and scenic rides that connect each moment.',
  },
  {
    label: 'Events, Festivals & Seasonal',
    icon: LuPartyPopper,
    description: 'Timely gatherings celebrating culture, tradition, and special occasions.',
  },
  {
    label: 'Volunteer & Community Impact',
    icon: LuHelpingHand,
    description: 'Give back with meaningful projects that support local communities.',
  },
  {
    label: 'Romantic & Special Occasions',
    icon: LuHeart,
    description: 'Curated moments for couples, celebrations, and heartfelt memories.',
  },
  {
    label: 'Family & Kids Activities',
    icon: LuBaby,
    description: 'Playful adventures crafted for little explorers and their grown-ups.',
  },
  {
    label: 'Business & Networking',
    icon: LuBriefcase,
    description: 'Professional meetups, corporate escapes, and industry networking events.',
  },
];

const Categories = () => {
  const params = useSearchParams();
  const category = params?.get('category');
  const pathname = usePathname();
  const router = useRouter();
  const isMainPage = pathname === '/';
  const [visible, setVisible] = useState(true);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const locationInputRef = useRef<CountrySearchSelectHandle | null>(null);
  const { location: globalLocation, setLocation: setGlobalLocation } = useExperienceSearchState();
  const countryHelpers = useCountries();
  const [keywordDraft, setKeywordDraft] = useState('');
  const previousLocationRef = useRef<CountrySelectValue | undefined>(undefined);
  const prevFiltersOpenRef = useRef(filtersOpen);
  const closeReasonRef = useRef<'apply' | 'dismiss'>('dismiss');
  const languageOptions = useMemo(
    () =>
      LANGUAGE_OPTIONS.map((option) => ({
        label: `${option.language}${option.region ? ` (${option.region})` : ''}`,
        value: option.code,
      })),
    [],
  );

  const resolvedInitialLocation = useMemo(() => {
    if (globalLocation) {
      return globalLocation;
    }

    const locationValue = params?.get('locationValue');
    if (!locationValue) {
      return undefined;
    }

    const popularMatch = countryHelpers
      .getPopularCities()
      .find((entry) => entry.value === locationValue);

    if (popularMatch) {
      return popularMatch;
    }

    const countryMatch = countryHelpers
      .getAll()
      .find((entry) => entry.value === locationValue);

    return countryMatch ?? undefined;
  }, [countryHelpers, globalLocation, params]);

  const initialFilters = useMemo<FiltersState>(() => {
    const parseMulti = (value: string | null): string[] =>
      value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

    return {
      groupStyles: parseMulti(params?.get('groupStyles') ?? null),
      duration: params?.get('duration') ?? null,
      environments: parseMulti(params?.get('environments') ?? null),
      activityForms: parseMulti(params?.get('activityForms') ?? null),
      languages: parseMulti(params?.get('languages') ?? null),
      keywords: parseMulti(params?.get('seoKeywords') ?? null),
    };
  }, [params]);

  const [draftFilters, setDraftFilters] = useState<FiltersState>(initialFilters);
  const [locationDraft, setLocationDraft] = useState<CountrySelectValue | undefined>(
    resolvedInitialLocation,
  );

  useEffect(() => {
    if (!globalLocation && resolvedInitialLocation) {
      setGlobalLocation(resolvedInitialLocation);
    }
  }, [globalLocation, resolvedInitialLocation, setGlobalLocation]);

  const hasActiveFilters = useMemo(
    () =>
      initialFilters.groupStyles.length > 0 ||
      !!initialFilters.duration ||
      initialFilters.environments.length > 0 ||
      initialFilters.activityForms.length > 0 ||
      initialFilters.languages.length > 0 ||
      initialFilters.keywords.length > 0 ||
      !!params?.get('locationValue'),
    [initialFilters, params]
  );

  const hasAnyDraftSelected = useMemo(
    () =>
      draftFilters.groupStyles.length > 0 ||
      !!draftFilters.duration ||
      draftFilters.environments.length > 0 ||
      draftFilters.activityForms.length > 0 ||
      draftFilters.languages.length > 0 ||
      draftFilters.keywords.length > 0 ||
      !!locationDraft,
    [draftFilters, locationDraft]
  );

  useEffect(() => {
    if (!filtersOpen) {
      setDraftFilters(initialFilters);
      setLocationDraft(resolvedInitialLocation);
      setKeywordDraft('');
    }
  }, [filtersOpen, initialFilters, resolvedInitialLocation]);

  useEffect(() => {
    if (filtersOpen && !prevFiltersOpenRef.current) {
      previousLocationRef.current = globalLocation ?? resolvedInitialLocation ?? undefined;
      closeReasonRef.current = 'dismiss';
    } else if (!filtersOpen && prevFiltersOpenRef.current) {
      if (closeReasonRef.current === 'dismiss') {
        setGlobalLocation(previousLocationRef.current);
        setLocationDraft(previousLocationRef.current);
      }
      closeReasonRef.current = 'dismiss';
    }

    prevFiltersOpenRef.current = filtersOpen;
  }, [
    filtersOpen,
    globalLocation,
    resolvedInitialLocation,
    setGlobalLocation,
    setLocationDraft,
  ]);

  // B) replace the preview-count effect so it runs whenever any filter is chosen (debounced)
  useEffect(() => {
    if (!hasAnyDraftSelected) {
      setPreviewCount(null);
      setPreviewLoading(false);
      return;
    }

    const queryObj: StringifiableRecord = {
      groupStyles: draftFilters.groupStyles.length ? draftFilters.groupStyles.join(',') : undefined,
      duration: draftFilters.duration ?? undefined,
      environments: draftFilters.environments.length ? draftFilters.environments.join(',') : undefined,
      activityForms: draftFilters.activityForms.length ? draftFilters.activityForms.join(',') : undefined,
      languages: draftFilters.languages.length ? draftFilters.languages.join(',') : undefined,
      seoKeywords: draftFilters.keywords.length ? draftFilters.keywords.join(',') : undefined,
      locationValue: locationDraft?.value,
    };

    const query = qs.stringify(queryObj, { skipNull: true, skipEmptyString: true });

    let cancelled = false;
    setPreviewLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/listings?${query}`);
        if (!cancelled) {
          setPreviewCount(Array.isArray(res.data) ? res.data.length : 0);
        }
      } catch {
        if (!cancelled) {
          setPreviewCount(null);
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
      setPreviewLoading(false);
    };
  }, [draftFilters, hasAnyDraftSelected, locationDraft]);

  const pauseAutoScroll = useCallback(() => {
    setAutoScrollPaused(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const scheduleAutoScrollResume = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setAutoScrollPaused(false);
    }, 3500);
  }, []);

  const handleInteractionStart = useCallback(() => {
    pauseAutoScroll();
  }, [pauseAutoScroll]);

  const handleInteractionEnd = useCallback(() => {
    scheduleAutoScrollResume();
  }, [scheduleAutoScrollResume]);

  useEffect(() => () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
  }, []);

  // useEffect(() => {
  //   if (autoScrollPaused) return;

  //   let frameId: number;
  //   const step = () => {
  //     const container = scrollContainerRef.current;
  //     if (!container) {
  //       frameId = requestAnimationFrame(step);
  //       return;
  //     }

  //     if (container.scrollWidth <= container.clientWidth + 4) {
  //       return;
  //     }

  //     container.scrollLeft += 0.35;
  //     if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
  //       container.scrollLeft = 0;
  //     }

  //     frameId = requestAnimationFrame(step);
  //   };

  //   frameId = requestAnimationFrame(step);

  //   return () => cancelAnimationFrame(frameId);
  // }, [autoScrollPaused]);

  useEffect(() => {
    setVisible(!category);
  }, [category]);

  useEffect(() => {
    const handleOpen = () => setVisible(true);

    window.addEventListener('categories:open', handleOpen);

    return () => {
      window.removeEventListener('categories:open', handleOpen);
    };
  }, []);

  const handleFiltersApply = useCallback(() => {
    const parsedQuery = params
      ? (qs.parse(params.toString()) as ParsedQuery<string>)
      : {};

    const currentQuery = Object.entries(parsedQuery).reduce<
      StringifiableRecord
    >((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value;
      } else if (value !== null && value !== undefined) {
        acc[key] = value;
      }

      return acc;
    }, {});

    const nextQuery: StringifiableRecord = {
      ...currentQuery,
      groupStyles:
        draftFilters.groupStyles.length > 0
          ? draftFilters.groupStyles.join(',')
          : undefined,
      duration: draftFilters.duration ?? undefined,
      environments:
        draftFilters.environments.length > 0
          ? draftFilters.environments.join(',')
          : undefined,
      activityForms:
        draftFilters.activityForms.length > 0
          ? draftFilters.activityForms.join(',')
          : undefined,
      languages:
        draftFilters.languages.length > 0
          ? draftFilters.languages.join(',')
          : undefined,
      seoKeywords:
        draftFilters.keywords.length > 0
          ? draftFilters.keywords.join(',')
          : undefined,
      locationValue: locationDraft?.value ?? undefined,
    };

    const url = qs.stringifyUrl(
      { url: '/', query: nextQuery },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
    setGlobalLocation(locationDraft);
    closeReasonRef.current = 'apply';
    setFiltersOpen(false);
  }, [draftFilters, locationDraft, params, router, setGlobalLocation]);

  const handleFiltersClear = useCallback(() => {
    setDraftFilters({
      groupStyles: [],
      duration: null,
      environments: [],
      activityForms: [],
      languages: [],
      keywords: [],
    });
    setLocationDraft(undefined);
    setGlobalLocation(undefined);
    previousLocationRef.current = undefined;

    const parsedQuery = params
      ? (qs.parse(params.toString()) as ParsedQuery<string>)
      : {};

    const currentQuery = Object.entries(parsedQuery).reduce<
      StringifiableRecord
    >((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value;
      } else if (value !== null && value !== undefined) {
        acc[key] = value;
      }

      return acc;
    }, {});

    delete currentQuery.groupStyles;
    delete currentQuery.duration;
    delete currentQuery.environments;
    delete currentQuery.activityForms;
    delete currentQuery.languages;
    delete currentQuery.seoKeywords;
    delete currentQuery.locationValue;

    const url = qs.stringifyUrl(
      { url: '/', query: currentQuery },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  }, [params, router, setGlobalLocation]);

  const toggleMultiFilter = useCallback(
    (key: keyof Omit<FiltersState, 'duration' | 'keywords'>, value: string) => {
      setDraftFilters((prev) => {
        const current = prev[key];
        const nextValues = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];

        return {
          ...prev,
          [key]: nextValues,
        };
      });
    },
    []
  );

  const selectDuration = useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      duration: prev.duration === value ? null : value,
    }));
  }, []);

  // const addKeyword = useCallback((value: string) => {
  //   const keyword = value.trim();
  //   if (!keyword) {
  //     return;
  //   }

  //   setDraftFilters((prev) => {
  //     if (prev.keywords.includes(keyword)) {
  //       return prev;
  //     }

  //     return {
  //       ...prev,
  //       keywords: [...prev.keywords, keyword],
  //     };
  //   });
  // }, []);

  // in Categories.tsx (keep your addKeyword callback, but normalize)
  const addKeyword = useCallback((value: string) => {
    const keyword = value.trim().toLowerCase();
    if (!keyword) return;
    setDraftFilters((prev) => (
      prev.keywords.includes(keyword)
        ? prev
        : { ...prev, keywords: [...prev.keywords, keyword] }
    ));
  }, []);

  const removeKeyword = useCallback((value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((item) => item !== value),
    }));
  }, []);

  const handleLocationChange = useCallback(
    (value: CountrySelectValue | undefined) => {
      setLocationDraft(value ?? undefined);
      setGlobalLocation(value);
    },
    [setGlobalLocation],
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let lastScrollY = window.scrollY;
    let hasScrolledDown = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;

      if (scrollDelta > 10) {
        hasScrolledDown = true;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          setVisible(false);
        }, 100);
      }

      if (currentScrollY <= 50 && hasScrolledDown) {
        if (timeout) clearTimeout(timeout);
        setVisible(true);
        hasScrolledDown = false;
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('categories:toggle', { detail: { visible } }));
  }, [visible]);

  if (!isMainPage) {
    return null;
  }

  return (
    <div className="relative w-full">
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="categories"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx('relative z-0 overflow-hidden', !visible && 'pointer-events-none')}
          >
            <Container>
              <div
                ref={scrollContainerRef}

                className="categorybox flex w-full  flex-row items-center gap-4 overflow-x-auto px-6 py-6 scroll-smooth scrollbar-thin sm:w-auto"
                // className="flex w-full snap-x snap-mandatory flex-row items-center gap-4 overflow-x-auto px-6 py-6 scroll-smooth scrollbar-thin sm:w-auto"

                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onWheel={() => {
                  handleInteractionStart();
                  scheduleAutoScrollResume();
                }}
              >
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className={clsx(
                    'flex h-[110px] w-[110px] shrink-0 flex-col items-center justify-between bg-white rounded-2xl p-4 text-neutral-600 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-neutral-300/50',
                    // 'flex h-[110px] w-[110px] shrink-0 flex-col items-center justify-between rounded-2xl bg-white p-4 text-neutral-600 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-neutral-300/50',
                    hasActiveFilters && 'text-neutral-900 shadow-xl shadow-neutral-400/60'
                  )}
                >
                  <div
                    className={clsx(
                      'relative flex h-12 w-12 p-2 items-center justify-center rounded-full bg-transparent shadow-md shadow-neutral-300/40',
                      // 'relative flex h-12 w-12 items-center justify-center rounded-full bg-transparent shadow-md shadow-neutral-300/40',
                      hasActiveFilters && 'shadow-neutral-400/60'
                    )}
                  >
                    <LuSlidersHorizontal
                      className={clsx('h-6 w-6', hasActiveFilters ? 'text-neutral-900' : 'text-neutral-600')}
                      aria-hidden="true"
                    />
                    {hasActiveFilters && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-neutral-900" aria-hidden="true" />
                    )}
                  </div>
                  <span className="mt-4 block h-10 w-full px-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-neutral-700">
                  {/* <span className="mt-2 block h-10 w-full px-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-neutral-700"> */}
                    Filters
                  </span>
                </button>
                {categories.map((item) => (
                  <CategoryBox
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    description={item.description}
                    selected={category === item.label}
                  />
                ))}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute bottom-[-12px] left-1/2 z-0 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300"
        // className="absolute bottom-[-12px] left-1/2 z-10 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300"
        aria-label={visible ? 'Collapse categories' : 'Expand categories'}
      >
        <motion.div animate={{ rotate: visible ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <LuChevronUp size={15} strokeWidth={3} className="text-black" />
        </motion.div>
      </button>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <div
              onClick={() => {
                closeReasonRef.current = 'dismiss';
                setFiltersOpen(false);
              }}
              tabIndex={-1}
              className="
                fixed inset-0 z-[100]
                h-screen
                flex
                items-start
                p-3
                pointer-events-auto
                outline-none focus:outline-none
                bg-black/30 w-full
              "
            >
              <motion.aside
                onClick={(e) => e.stopPropagation()}
                key="filters-panel"
                className="
                  pointer-events-auto
                  h-full w-[80vw] lg:w-[35vw]
                  rounded-2xl
                  z-[101]
                  bg-white
                  shadow-2xl
                  backdrop-blur-3xl
                  flex flex-col
                  overflow-hidden
                "
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut', type: 'tween' }}
    >

                {/* Header */}
                <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">Refine experiences</h2>
                      <p className="text-sm text-neutral-600">Choose filters to surface matching listings.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeReasonRef.current = 'dismiss';
                        setFiltersOpen(false);
                      }}
                      className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:text-neutral-900"
                      aria-label="Close filters"
                    >
                      <LuChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 md:px-10 pb-6 scroll-smooth">
                  <div className="mt-2 flex flex-col gap-6">
                    <section
                      className="rounded-xl bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow border border-neutral-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl aspect-square shadow-md text-neutral-900">
                          <LuSearch className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900">Search by location</h3>
                          <p className="text-xs text-neutral-500">
                            Find experiences in a specific city or country.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <CountrySearchSelect
                          ref={locationInputRef}
                          value={locationDraft}
                          onChange={handleLocationChange}
                        />
                      </div>
                    </section>

                    <FilterSection
                      id="group-styles"
                      icon={LuUsers}
                      title="By Group Style"
                      description="Select all group styles that fit your experience."
                      options={GROUP_STYLE_OPTIONS}
                      values={draftFilters.groupStyles}
                      onToggle={(value) => toggleMultiFilter('groupStyles', value)}
                    />

                    <FilterSection
                      id="duration"
                      icon={LuClock3}
                      title="By Duration"
                      description="Choose the primary length of your activity."
                      options={DURATION_OPTIONS}
                      values={draftFilters.duration ? [draftFilters.duration] : []}
                      onToggle={(value) => selectDuration(value)}
                      single
                    />

                    <FilterSection
                      id="environments"
                      icon={LuGlobe2}
                      title="By Environment"
                      description="Highlight the environments guests will explore."
                      options={ENVIRONMENT_OPTIONS}
                      values={draftFilters.environments}
                      onToggle={(value) => toggleMultiFilter('environments', value)}
                    />

                    <FilterSection
                      id="activity-forms"
                      icon={LuActivity}
                      title="By Activity Form"
                      description="Tell guests how they will move through the experience."
                      options={ACTIVITY_FORM_OPTIONS}
                      values={draftFilters.activityForms}
                      onToggle={(value) => toggleMultiFilter('activityForms', value)}
                    />

                    <FilterSection
                      id="languages"
                      icon={LuLanguages}
                      title="By Language"
                      description="Select the languages your host can speak."
                      options={languageOptions}
                      values={draftFilters.languages}
                      onToggle={(value) => toggleMultiFilter('languages', value)}
                    />

                    <KeywordsSection
                      id="keywords"
                      icon={LuTag}
                      title="By Keywords"
                      description="Surface experiences with matching SEO keywords."
                      values={draftFilters.keywords}
                      inputValue={keywordDraft}
                      onInputChange={setKeywordDraft}
                      onAdd={(value) => {
                        addKeyword(value);
                        setKeywordDraft('');
                      }}
                      onRemove={removeKeyword}
                    />
                  </div>
                </div>

                {/* Fixed bottom buttons */}
                <div
                  className="
                    px-6 md:px-10 pt-3 pb-4 md:pb-6
                    border-t border-neutral-200
                    bg-white/90 backdrop-blur-md
                  "
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
                >
                  <div className="flex flex-col gap-3">


                    <button
                      type="button"
                      onClick={handleFiltersApply}
                      className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    >
                      {!hasAnyDraftSelected ? (
                        'Apply changes'
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>Show</span>
                          {previewLoading && (
                            <LuLoader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          )}
                          {previewCount !== null && !previewLoading && (
                            <span className="font-semibold">{previewCount}</span>
                          )}
                          <span>
                            {previewCount !== null && !previewLoading
                              ? previewCount === 1
                                ? 'experience'
                                : 'experiences'
                              : 'experiences'}
                          </span>
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleFiltersClear}
                      className="w-full rounded-full border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              </motion.aside>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Categories;

interface FilterSectionProps {
  id?: string;
  title: string;
  description: string;
  options: { label: string; value: string }[];
  values: string[];
  onToggle: (value: string) => void;
  single?: boolean;
  icon: IconType;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  id,
  title,
  description,
  options,
  values,
  onToggle,
  single = false,
  icon: Icon,
}) => (
  <section
    id={id}
    className="
      rounded-xl
      bg-white
      shadow-sm
      hover:shadow-md
      transition-shadow
      p-4 md:p-5
      border border-neutral-100
    "
  >
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl aspect-square shadow-md text-neutral-900">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={clsx(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-all border shadow-sm',
              isActive
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
            )}
            aria-pressed={isActive}
          >
            {option.label}
            {single && isActive && <span className="sr-only"> selected</span>}
          </button>
        );
      })}
    </div>
  </section>
);

interface KeywordsSectionProps {
  id?: string;
  title: string;
  description: string;
  values: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  icon: IconType;
}

const KeywordsSection: React.FC<KeywordsSectionProps> = ({
  id,
  title,
  description,
  values,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  icon: Icon,
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      onAdd(inputValue);
      onInputChange('');
    }
  };

  return (
    <section
      id={id}
      className="
        rounded-xl
        bg-white
        shadow-sm
        hover:shadow-md
        transition-shadow
        p-4 md:p-5
        border border-neutral-100
      "
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl aspect-square shadow-md text-neutral-900">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {values.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700"
          >
            #{keyword}
            <button
              type="button"
              onClick={() => onRemove(keyword)}
              className="rounded-full bg-white/80 p-0.5 text-neutral-400 transition hover:text-neutral-700"
              aria-label={`Remove keyword ${keyword}`}
            >
              ×
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-neutral-400">No keywords selected yet.</span>
        )}
      </div>

      <div>
        <label className="sr-only" htmlFor={`${id}-input`}>
          Add keyword
        </label>
        <input
          id={`${id}-input`}
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Press enter to add keywords"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-0"
        />
      </div>
    </section>
  );
};
