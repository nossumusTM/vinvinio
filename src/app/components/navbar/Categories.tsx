'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryBox from '../CategoryBox';
import Container from '../Container';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LuBaby,
  LuCompass,
  LuBriefcase,
  LuBus,
  LuChevronUp,
  LuDumbbell,
  LuGem,
  LuGraduationCap,
  LuHeart,
  LuHelpingHand,
  LuLandmark,
  LuLotus,
  LuMountain,
  LuMusic2,
  LuPalette,
  LuPartyPopper,
  LuSlidersHorizontal,
  LuUtensils,
  LuWaves,
  LuLeaf,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import qs from 'query-string';
import {
  ACTIVITY_FORM_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GROUP_STYLE_OPTIONS,
} from '@/app/constants/experienceFilters';

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
    icon: LuLotus,
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

  const initialFilters = useMemo<FiltersState>(() => {
    const parseMulti = (value: string | null): string[] =>
      value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

    return {
      groupStyles: parseMulti(params?.get('groupStyles') ?? null),
      duration: params?.get('duration') ?? null,
      environments: parseMulti(params?.get('environments') ?? null),
      activityForms: parseMulti(params?.get('activityForms') ?? null),
    };
  }, [params]);

  const hasActiveFilters = useMemo(
    () =>
      initialFilters.groupStyles.length > 0 ||
      !!initialFilters.duration ||
      initialFilters.environments.length > 0 ||
      initialFilters.activityForms.length > 0,
    [initialFilters]
  );

  const [draftFilters, setDraftFilters] = useState<FiltersState>(initialFilters);

  useEffect(() => {
    if (!filtersOpen) {
      setDraftFilters(initialFilters);
    }
  }, [filtersOpen, initialFilters]);

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

  useEffect(() => {
    if (autoScrollPaused) return;

    let frameId: number;
    const step = () => {
      const container = scrollContainerRef.current;
      if (!container) {
        frameId = requestAnimationFrame(step);
        return;
      }

      if (container.scrollWidth <= container.clientWidth + 4) {
        return;
      }

      container.scrollLeft += 0.35;
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
        container.scrollLeft = 0;
      }

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [autoScrollPaused]);

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
    const currentQuery = params ? qs.parse(params.toString()) : {};

    const nextQuery: Record<string, unknown> = {
      ...currentQuery,
      groupStyles:
        draftFilters.groupStyles.length > 0
          ? draftFilters.groupStyles.join(',')
          : undefined,
      duration: draftFilters.duration || undefined,
      environments:
        draftFilters.environments.length > 0
          ? draftFilters.environments.join(',')
          : undefined,
      activityForms:
        draftFilters.activityForms.length > 0
          ? draftFilters.activityForms.join(',')
          : undefined,
    };

    const url = qs.stringifyUrl(
      { url: '/', query: nextQuery },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
    setFiltersOpen(false);
  }, [draftFilters, params, router]);

  const handleFiltersClear = useCallback(() => {
    setDraftFilters({
      groupStyles: [],
      duration: null,
      environments: [],
      activityForms: [],
    });

    const currentQuery = params ? qs.parse(params.toString()) : {};

    delete currentQuery.groupStyles;
    delete currentQuery.duration;
    delete currentQuery.environments;
    delete currentQuery.activityForms;

    const url = qs.stringifyUrl(
      { url: '/', query: currentQuery },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  }, [params, router]);

  const toggleMultiFilter = useCallback(
    (key: keyof Omit<FiltersState, 'duration'>, value: string) => {
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
                className="flex w-full snap-x snap-mandatory flex-row items-center gap-3 overflow-x-auto p-4 scroll-smooth scrollbar-thin sm:w-auto"
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
                    'flex h-[110px] w-[110px] shrink-0 flex-col items-center justify-between rounded-xl border bg-white p-3 text-neutral-600 transition-all duration-300 hover:border-neutral-300 hover:shadow-md',
                    hasActiveFilters && 'border-neutral-400 text-neutral-900 shadow-lg shadow-neutral-300/60'
                  )}
                >
                  <div
                    className={clsx(
                      'relative flex h-12 w-12 items-center justify-center rounded-lg border shadow-sm',
                      hasActiveFilters ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-200 bg-neutral-100'
                    )}
                  >
                    <LuSlidersHorizontal className="h-6 w-6 text-neutral-600" aria-hidden="true" />
                    {hasActiveFilters && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-neutral-900" aria-hidden="true" />
                    )}
                  </div>
                  <span className="mt-2 block h-10 w-full px-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-neutral-700">
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
        className="absolute bottom-[-12px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-white p-1 shadow-md transition-transform duration-300"
        aria-label={visible ? 'Collapse categories' : 'Expand categories'}
      >
        <motion.div animate={{ rotate: visible ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <LuChevronUp size={15} strokeWidth={3} className="text-black" />
        </motion.div>
      </button>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              key="filters-backdrop"
              className="fixed inset-0 z-40 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.aside
              key="filters-panel"
              className="fixed inset-y-0 left-0 z-50 w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Refine experiences</h2>
                  <p className="text-sm text-neutral-600">Choose filters to surface matching listings.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:text-neutral-900"
                  aria-label="Close filters"
                >
                  <LuChevronUp className="h-4 w-4 rotate-90" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-6">
                <FilterSection
                  title="By Group Style"
                  description="Select all group styles that fit your experience."
                  options={GROUP_STYLE_OPTIONS}
                  values={draftFilters.groupStyles}
                  onToggle={(value) => toggleMultiFilter('groupStyles', value)}
                />

                <FilterSection
                  title="By Duration"
                  description="Choose the primary length of your activity."
                  options={DURATION_OPTIONS}
                  values={draftFilters.duration ? [draftFilters.duration] : []}
                  onToggle={(value) => selectDuration(value)}
                  single
                />

                <FilterSection
                  title="By Environment"
                  description="Highlight the environments guests will explore."
                  options={ENVIRONMENT_OPTIONS}
                  values={draftFilters.environments}
                  onToggle={(value) => toggleMultiFilter('environments', value)}
                />

                <FilterSection
                  title="By Activity Form"
                  description="Tell guests how they will move through the experience."
                  options={ACTIVITY_FORM_OPTIONS}
                  values={draftFilters.activityForms}
                  onToggle={(value) => toggleMultiFilter('activityForms', value)}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleFiltersApply}
                  className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Show {hasActiveFilters ? 'updated' : 'matching'} experiences
                </button>
                <button
                  type="button"
                  onClick={handleFiltersClear}
                  className="w-full rounded-full border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
                >
                  Clear filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Categories;

interface FilterSectionProps {
  title: string;
  description: string;
  options: { label: string; value: string }[];
  values: string[];
  onToggle: (value: string) => void;
  single?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  description,
  options,
  values,
  onToggle,
  single = false,
}) => (
  <section>
    <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
    <p className="mb-3 text-xs text-neutral-500">{description}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={clsx(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              isActive
                ? 'border-neutral-800 bg-neutral-900 text-white shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
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
