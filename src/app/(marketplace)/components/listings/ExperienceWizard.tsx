'use client';

import axios from 'axios';
import { useState, useEffect, useMemo, useRef, useCallback, type MouseEvent } from 'react';
import { Controller, useFieldArray, useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Input from '../inputs/Input';
import Heading from '../Heading';
import ImageUpload from '../inputs/ImageUpload';
import Counter from '../inputs/Counter';
import CategoryInput from '../inputs/CategoryInput';
import Button from '../Button';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import { categories } from '../navbar/Categories';
import CountrySearchSelect, { CountrySearchSelectHandle } from '../inputs/CountrySearchSelect';
import MeetingPointAutocomplete from '../inputs/MeetingPointAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants, Transition } from 'framer-motion';
import { SafeListing, SafeUser } from '@/app/(marketplace)/types';
import {
  ACTIVITY_FORM_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GROUP_STYLE_OPTIONS,
  SEO_KEYWORD_OPTIONS,
} from '@/app/(marketplace)/constants/experienceFilters';

import {
  DEFAULT_TIME_SLOTS,
  formatTimeLabel,
  ListingAvailabilityRules,
  normalizeAvailabilityRules,
  normalizeTimeSlot,
} from '@/app/(marketplace)/utils/timeSlots';

import { FiClock, FiDollarSign, FiFileText, FiGlobe, FiImage, FiList, FiMapPin, FiSliders, FiUsers } from 'react-icons/fi';


const hourOptions = [
  '1', '1.5', '2', '2.5', '3', '4', '5', '6', '7', '8', '9',
  '10', '11', '12', '13', '14', '15', '16'
].map((h) => ({ label: `${h} hours`, value: h }));

const timeSlotOptions = Array.from(DEFAULT_TIME_SLOTS).map((time) => ({
  value: time,
  label: formatTimeLabel(time),
}));

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const hoursNoticeOptions = Array.from({ length: 49 }, (_, i) => i).map((h) => ({
  value: h,
  label: h === 0 ? 'No advance notice' : `${h} hour${h === 1 ? '' : 's'} notice`,
}));

const languageOptions = [
  'English', 'Italian', 'Turkish', 'Russian', 'Español', 'Azerbaijani',
  'Français', 'Polski', 'Українська', 'Nederlands', 'Português', 'Română'
].map((lang) => ({ label: lang, value: lang }));

const SearchMap = dynamic(() => import('../SearchMap'), {
  ssr: false,
  loading: () => <div className="h-56 md:h-80 w-full rounded-xl bg-neutral-100 animate-pulse" />,
});

const locationTypeOptions = [
  // {
  //   label: "Spiritual Venues",
  //   options: [
  //     { label: "Cemetery", value: "cemetery" },
  //     { label: "Church", value: "church" },
  //     { label: "Mosque", value: "mosque" },
  //     { label: "Synagogue", value: "synagogue" },
  //     { label: "Temple", value: "temple" },
  //   ],
  // },
  {
    label: "Attractions",
    options: [
      { label: "Fountain", value: "fountain" },
      { label: "Historic site", value: "historic_site" },
      { label: "Lighthouse", value: "lighthouse" },
      { label: "Memorial site", value: "memorial_site" },
      { label: "Monument", value: "monument" },
      { label: "Plaza", value: "plaza" },
      { label: "Tourist information center", value: "tourist_center" },
    ],
  },
  {
    label: "Residential Places",
    options: [
      { label: "Apartment", value: "apartment" },
      { label: "Backyard", value: "backyard" },
      { label: "Common area", value: "common_area" },
      { label: "Garage", value: "garage" },
      { label: "House", value: "house" },
      { label: "Patio", value: "patio" },
      { label: "Rooftop patio", value: "rooftop_patio" },
    ],
  },
  {
    label: "Civic & Educational Spaces",
    options: [
      { label: "Animal rescue center", value: "rescue_center" },
      { label: "City", value: "city" },
      { label: "City hall", value: "city_hall" },
      { label: "Hospital", value: "hospital" },
      { label: "Library", value: "library" },
      { label: "Neighborhood", value: "neighborhood" },
      { label: "Palace", value: "palace" },
      { label: "School", value: "school" },
      { label: "University", value: "university" },
    ],
  },
  {
    label: "Health & Fitness Spaces",
    options: [
      { label: "Bath house", value: "bath_house" },
      { label: "Beauty venue", value: "beauty_venue" },
      { label: "Gym", value: "gym" },
      { label: "Massage studio", value: "massage_studio" },
      { label: "Nail salon", value: "nail_salon" },
      { label: "Sauna", value: "sauna" },
      { label: "Sports venue", value: "sports_venue" },
      { label: "Wellness venue", value: "wellness_venue" },
      { label: "Workout studio", value: "workout_studio" },
    ],
  },
  {
    label: "Shopping Spaces",
    options: [
      { label: "Bookstores", value: "bookstores" },
      { label: "Boutique", value: "boutique" },
      { label: "Clothing store", value: "clothing_store" },
      { label: "Cosmetics shop", value: "cosmetics_shop" },
      { label: "Costume shop", value: "costume_shop" },
      { label: "Flea market", value: "flea_market" },
      { label: "Flower shop", value: "flower_shop" },
      { label: "Market", value: "market" },
      { label: "Shopping mall", value: "shopping_mall" },
      { label: "Shops", value: "shops" },
    ],
  },
  {
    label: "Food & Drink",
    options: [
      { label: "Bakery", value: "bakery" },
      { label: "Beer shop", value: "beer_shop" },
      { label: "Brewery", value: "brewery" },
      { label: "Butcher shop", value: "butcher_shop" },
      { label: "Cafe", value: "cafe" },
      { label: "Cheese shop", value: "cheese_shop" },
      { label: "Cooking school", value: "cooking_school" },
      { label: "Delicatessen", value: "delicatessen" },
      { label: "Distillery", value: "distillery" },
      { label: "Farmers market", value: "farmers_market" },
      { label: "Fish market", value: "fish_market" },
      { label: "Food court", value: "food_court" },
      { label: "Food stand", value: "food_stand" },
      { label: "Food truck", value: "food_truck" },
      { label: "Grocery stores", value: "grocery_stores" },
      { label: "Ice cream shop", value: "ice_cream_shop" },
      { label: "Restaurants", value: "restaurants" },
      { label: "Winery", value: "winery" },
    ],
  },
  {
    label: "Entertainment & Culture",
    options: [
      { label: "Amusement park", value: "amusement_park" },
      { label: "Aquarium", value: "aquarium" },
      { label: "Arcade", value: "arcade" },
      { label: "Art gallery", value: "art_gallery" },
      { label: "Arts venue", value: "arts_venue" },
      { label: "Bar", value: "bar" },
      { label: "Beer garden", value: "beer_garden" },
      { label: "Casino", value: "casino" },
      { label: "Club", value: "club" },
      { label: "Event venue", value: "event_venue" },
      { label: "Film studio", value: "film_studio" },
      { label: "Jazz club", value: "jazz_club" },
      { label: "Karaoke", value: "karaoke" },
      { label: "Movie theater", value: "movie_theater" },
      { label: "Museums", value: "museums" },
      { label: "Music venue", value: "music_venue" },
      { label: "Observatory", value: "observatory" },
      { label: "Pub", value: "pub" },
      { label: "Stadium", value: "stadium" },
      { label: "Theater venue", value: "theater_venue" },
      { label: "Wine bar", value: "wine_bar" },
      { label: "Zoo", value: "zoo" },
    ],
  },
  {
    label: "Nature & Outdoors",
    options: [
      { label: "Bay", value: "bay" },
      { label: "Beach", value: "beach" },
      { label: "Campground", value: "campground" },
      { label: "Cave", value: "cave" },
      { label: "Countryside", value: "countryside" },
      { label: "Desert", value: "desert" },
      { label: "Farm", value: "farm" },
      { label: "Field", value: "field" },
      { label: "Forest", value: "forest" },
      { label: "Garden", value: "garden" },
      { label: "Harbor", value: "harbor" },
      { label: "Hot Spring", value: "hot_spring" },
      { label: "Island", value: "island" },
      { label: "Jungle", value: "jungle" },
      { label: "Lake", value: "lake" },
      { label: "Mountain", value: "mountain" },
      { label: "Ocean", value: "ocean" },
      { label: "Parks", value: "parks" },
      { label: "Pond", value: "pond" },
      { label: "Pool", value: "pool" },
      { label: "Rainforest", value: "rainforest" },
      { label: "River", value: "river" },
      { label: "Ski area", value: "ski_area" },
      { label: "Tidepools", value: "tidepools" },
      { label: "Trail", value: "trail" },
      { label: "Tundra", value: "tundra" },
      { label: "Vineyard", value: "vineyard" },
      { label: "Volcano", value: "volcano" },
      { label: "Waterfall", value: "waterfall" },
      { label: "Waterfront", value: "waterfront" },
    ],
  },
];

const itemFade: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring', // now typed correctly
      stiffness: 380,
      damping: 30,
      mass: 0.6,
    },
  },
};

// Reusable, correctly typed spring
const springX: Transition = {
  type: 'spring' as const,  // <- keep the literal
  stiffness: 380,
  damping: 30,
  mass: 0.6,
};

const stepVariants: Variants = {
  enter: (custom) => {
    const direction = typeof custom === 'number' ? custom : 1;
    return {
      opacity: 0,
      x: 20 * direction,
      filter: 'blur(4px)',
    };
  },
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      x: { type: 'spring', stiffness: 380, damping: 30, mass: 0.6 },
      opacity: { duration: 0.18 },
    },
  },
  exit: (custom) => {
    const direction = typeof custom === 'number' ? custom : 1;
    return {
      opacity: 0,
      x: -20 * direction,
      filter: 'blur(4px)',
      transition: { duration: 0.16 },
    };
  },
};

const groupStyleOptions = GROUP_STYLE_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

const durationCategoryOptions = DURATION_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

const environmentOptions = ENVIRONMENT_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

const activityFormOptions = ACTIVITY_FORM_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

const seoKeywordOptions = SEO_KEYWORD_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

enum STEPS {
  CATEGORY = 0,
  LOCATION = 1,
  INFO1 = 2,
  INFO2 = 3,
  INFO3 = 4,
  FILTERS = 5,
  IMAGES = 6,
  DESCRIPTION = 7,
  PRICE = 8,
}

type PricingTier = {
  minGuests: number;
  maxGuests: number;
  price: number;
};

type VinSubscriptionOptionForm = {
  id: string;
  label: string;
  description: string;
  price: number | null;
  interval: 'monthly' | 'yearly';
};

const PRICING_TYPES = {
  FIXED: 'fixed',
  GROUP: 'group',
  CUSTOM: 'custom',
} as const;

interface ExperienceWizardProps {
  currentUser: SafeUser | null;
  initialListing?: SafeListing | null;
  onCancel?: () => void;
  onCompleted?: (listingId?: string) => void;
  headingOverride?: { title: string; subtitle?: string };
}

type ListingDraftSummary = {
  id: string;
  title: string | null;
  step: number | null;
  updatedAt: string;
  data?: Record<string, unknown> | null;
};

const ExperienceWizard: React.FC<ExperienceWizardProps> = ({
  currentUser,
  initialListing = null,
  onCancel,
  onCompleted,
  headingOverride,
}) => {
  const router = useRouter();

  const [step, setStep] = useState(STEPS.CATEGORY);
  const [isLoading, setIsLoading] = useState(false);

  const [locationQuery, setLocationQuery] = useState('');
  const { getAll, getByValue } = useCountries();
  const allLocations = useMemo(() => getAll(), [getAll]);
  const flatLocationTypeOptions = useMemo(
    () => locationTypeOptions.flatMap((group) => group.options),
    [],
  );

  const searchInputRef = useRef<CountrySearchSelectHandle | null>(null);
  const [locationError, setLocationError] = useState(false);

  const containerStagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const [specificDateInput, setSpecificDateInput] = useState('');

  const buildSubscriptionOption = useCallback(
    (overrides?: Partial<VinSubscriptionOptionForm>): VinSubscriptionOptionForm => {
      const optionId =
        typeof overrides?.id === 'string' && overrides.id.trim().length > 0
          ? overrides.id.trim()
          : `option-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

      return {
        id: optionId,
        label: overrides?.label ?? 'Standard plan',
        description: overrides?.description ?? '',
        price: typeof overrides?.price === 'number' ? overrides.price : null,
        interval: overrides?.interval ?? 'monthly',
      };
    },
    [],
  );

  const subscriptionIntervalOptions = useMemo(
    () =>
      [
        { value: 'monthly', label: 'Monthly', description: 'Charged every month' },
        { value: 'yearly', label: 'Yearly', description: 'Charged once per year' },
      ] as const,
    [],
  );

  const [specificDateTimes, setSpecificDateTimes] = useState<any[]>([]);
  const [monthInput, setMonthInput] = useState('');
  const [monthTimes, setMonthTimes] = useState<any[]>([]);
  const [yearInput, setYearInput] = useState('');
  const [yearTimes, setYearTimes] = useState<any[]>([]);

  const toSelectValues = (times?: string[]) =>
    (times ?? []).map((time) => ({ value: normalizeTimeSlot(time), label: formatTimeLabel(time) }));

  const extractTimes = (values: any[]) =>
    values
      .map((v) => normalizeTimeSlot(typeof v === 'string' ? v : v?.value ?? ''))
      .filter((value) => value && /^[0-2]\d:[0-5]\d$/.test(value));

  const saveSpecificDateTimes = () => {
    if (!specificDateInput) return;
    const times = extractTimes(specificDateTimes);
    updateAvailability((current) => ({
      ...current,
      specificDates: {
        ...(current.specificDates ?? {}),
        [specificDateInput]: times,
      },
    }));
    setSpecificDateTimes([]);
  };

  const saveMonthTimes = () => {
    if (!monthInput) return;
    const times = extractTimes(monthTimes);
    updateAvailability((current) => ({
      ...current,
      months: {
        ...(current.months ?? {}),
        [monthInput]: times,
      },
    }));
  };

  const saveYearTimes = () => {
    if (!yearInput) return;
    const times = extractTimes(yearTimes);
    updateAvailability((current) => ({
      ...current,
      years: {
        ...(current.years ?? {}),
        [yearInput]: times,
      },
    }));
  };

    const removeSpecificDate = (dateKey: string) => {
    updateAvailability((current) => {
      const nextSpecific = { ...(current.specificDates ?? {}) };
      delete nextSpecific[dateKey];
      return { ...current, specificDates: nextSpecific };
    });
  };

  const removeMonth = (monthKey: string) => {
    updateAvailability((current) => {
      const nextMonths = { ...(current.months ?? {}) };
      delete nextMonths[monthKey];
      return { ...current, months: nextMonths };
    });
  };

  const removeYear = (yearKey: string) => {
    updateAvailability((current) => {
      const nextYears = { ...(current.years ?? {}) };
      delete nextYears[yearKey];
      return { ...current, years: nextYears };
    });
  };

  // const itemFade = {
  //   hidden: { opacity: 0, y: 8 },
  //   show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30, mass: 0.6 } },
  // };

  const panelVariants = {
    hidden: { opacity: 0, y: 6 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.18 } },
    exit:   { opacity: 0, y: -6, transition: { duration: 0.15 } },
  };

  const locationMatches = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return [];
    return allLocations
      .filter((c: any) => {
        const hay = [
          c.label,          // country name
          c.region,         // region/continent
          c.city,           // common city (if provided by your hook)
          c.value,          // country code
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [locationQuery, allLocations]);

  const applyLocation = (opt: any) => {
    setCustomValue('location', opt);
    setLocationQuery(`${opt.city ? `${opt.city}, ` : ''}${opt.label}`);
  };


  const defaultFormValues = useMemo(
    () => ({
      category: [],
      location: null,
      guestCount: 1,
      imageSrc: [],
      title: '',
      description: '',
      price: 100,
      experienceHour: null,
      hoursInAdvance: 0,
      hostDescription: '',
      meetingPoint: '',
      languages: [],
      locationType: [],
      locationDescription: '',
      groupStyles: [],
      durationCategory: null,
      environments: [],
      activityForms: [],
      primarySeoKeyword: null,
      seoKeywords: [],
      availabilityRules: {
        defaultTimes: Array.from(DEFAULT_TIME_SLOTS),
        daysOfWeek: {},
        months: {},
        years: {},
        specificDates: {},
      },
      pricingType: PRICING_TYPES.FIXED,
      groupPrice: null,
      groupSize: null,
      customPricing: [
        {
          minGuests: 1,
          maxGuests: 2,
          price: 100,
        },
      ] as PricingTier[],
      vinSubscriptionEnabled: false,
      vinSubscriptionInterval: 'monthly',
      vinSubscriptionPrice: null,
      vinSubscriptionTerms: '',
      vinSubscriptionOptions: [buildSubscriptionOption()],
    }),
    [buildSubscriptionOption],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    control,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: defaultFormValues,
  });

  const category = watch('category');
  const location = watch('location');
  const guestCount = watch('guestCount');
  const imageSrc = watch('imageSrc');
  const groupStyles = watch('groupStyles');
  const durationCategory = watch('durationCategory');
  const environments = watch('environments');
  const activityForms = watch('activityForms');
  const seoKeywords = watch('seoKeywords');
  const primarySeoKeyword = watch('primarySeoKeyword');
  const hoursInAdvance = watch('hoursInAdvance');
  const availabilityRules = watch('availabilityRules');
  const pricingType = watch('pricingType');
  const customPricing = watch('customPricing');
  const groupPrice = watch('groupPrice');
  const groupSize = watch('groupSize');
  const price = watch('price');
  const vinSubscriptionEnabled = watch('vinSubscriptionEnabled');
  const vinSubscriptionInterval = watch('vinSubscriptionInterval');
  const vinSubscriptionPrice = watch('vinSubscriptionPrice');
  const vinSubscriptionTerms = watch('vinSubscriptionTerms');
  const vinSubscriptionOptions = watch('vinSubscriptionOptions');

  const {
    fields: customPricingFields,
    append: appendPricingTier,
    remove: removePricingTier,
  } = useFieldArray({
    control,
    name: 'customPricing',
  });

  const {
    fields: vinSubscriptionOptionFields,
    append: appendVinSubscriptionOption,
    remove: removeVinSubscriptionOption,
  } = useFieldArray({
    control,
    name: 'vinSubscriptionOptions',
  });

  const editingListing = initialListing;
  const isEditing = Boolean(editingListing);
  const [savedDrafts, setSavedDrafts] = useState<ListingDraftSummary[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavedServicesOpen, setIsSavedServicesOpen] = useState(true);

  const setCustomValue = useCallback(
    (id: string, value: any) => {
      setValue(id, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const fetchSavedDrafts = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    try {
      const response = await axios.get('/api/listings/drafts');
      setSavedDrafts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch saved drafts', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    void fetchSavedDrafts();
  }, [currentUser, fetchSavedDrafts]);

  const editingHydration = useMemo(() => {
    if (!editingListing) {
      return null;
    }

    const toOption = (
      value: string,
      options: { value: string; label: string }[],
    ) => {
      const normalized = value?.trim();
      if (!normalized) {
        return undefined;
      }
      const match = options.find(
        (option) =>
          option.value === normalized || option.label === normalized,
      );

      if (match) {
        return match;
      }

      return { value: normalized, label: normalized };
    };

    const resolveOptions = (
      values: string[] | null | undefined,
      options: { value: string; label: string }[],
    ) =>
      Array.isArray(values)
        ? values
            .map((value) => toOption(value, options))
            .filter((value): value is { value: string; label: string } => Boolean(value))
        : [];

    const resolvedLanguages = resolveOptions(
      editingListing.languages,
      languageOptions,
    );

    const resolvedLocationTypes = resolveOptions(
      editingListing.locationType,
      flatLocationTypeOptions,
    );

    const resolvedGroupStyles = resolveOptions(
      editingListing.groupStyles,
      GROUP_STYLE_OPTIONS,
    );

    const resolvedEnvironments = resolveOptions(
      editingListing.environments,
      ENVIRONMENT_OPTIONS,
    );

    const resolvedActivities = resolveOptions(
      editingListing.activityForms,
      ACTIVITY_FORM_OPTIONS,
    );

    const resolvedKeywords = resolveOptions(
      editingListing.seoKeywords,
      SEO_KEYWORD_OPTIONS,
    );

    const [primaryKeywordOption, ...additionalKeywordOptions] =
      resolvedKeywords;

    const resolvedDuration = editingListing.durationCategory
      ? toOption(editingListing.durationCategory, DURATION_OPTIONS)
      : null;

    const resolvedAvailability =
      normalizeAvailabilityRules(editingListing.availabilityRules) ??
      defaultFormValues.availabilityRules;

    const experienceHourValue = (() => {
      if (typeof editingListing.experienceHour === 'number') {
        return editingListing.experienceHour;
      }
      if (typeof editingListing.experienceHour === 'string') {
        return Number(editingListing.experienceHour);
      }
      return null;
    })();

    const resolvedExperienceHour = experienceHourValue
      ? hourOptions.find(
          (option) => Number(option.value) === Number(experienceHourValue),
        ) ?? { value: String(experienceHourValue), label: `${experienceHourValue} hours` }
      : null;

    const determineLocation = () => {
      const raw = editingListing.locationValue;
      if (!raw) return null;

      const directMatch = allLocations.find(
        (location: any) => location.value === raw,
      );
      if (directMatch) {
        return { ...directMatch, value: raw };
      }

      const segments = raw.split('-');
      if (segments.length === 0) {
        return null;
      }

      const countryCode = segments[segments.length - 1]?.toUpperCase();
      const fallbackCountry = countryCode ? getByValue(countryCode) : null;
      const citySlug = segments.slice(0, -1).join('-');
      const formattedCity = citySlug
        ? citySlug
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : fallbackCountry?.city;

      if (fallbackCountry) {
        return {
          ...fallbackCountry,
          value: raw,
          city: formattedCity || fallbackCountry.city,
        };
      }

      if (!formattedCity) {
        return null;
      }

      return {
        value: raw,
        label: formattedCity,
        city: formattedCity,
        flag: '',
        latlng: [0, 0] as [number, number],
        region: '',
      };
    };

    const resolvedLocation = determineLocation();

    const pricingMode = (() => {
      if (editingListing.pricingType) {
        return editingListing.pricingType;
      }
      if (Array.isArray(editingListing.customPricing) && editingListing.customPricing.length > 0) {
        return PRICING_TYPES.CUSTOM;
      }
      return PRICING_TYPES.FIXED;
    })();

    const normalizedCustomPricing =
      pricingMode === PRICING_TYPES.CUSTOM &&
      Array.isArray(editingListing.customPricing) &&
      editingListing.customPricing.length > 0
        ? editingListing.customPricing.map((tier) => ({
            minGuests: Number(tier?.minGuests ?? 0),
            maxGuests: Number(tier?.maxGuests ?? 0),
            price: Number(tier?.price ?? 0),
          }))
        : defaultFormValues.customPricing.map((tier: PricingTier) => ({
            minGuests: tier.minGuests,
            maxGuests: tier.maxGuests,
            price: tier.price,
          }));

    const normalizedCategories = Array.isArray(editingListing.category)
      ? editingListing.category
      : typeof editingListing.category === 'string'
        ? [editingListing.category]
        : [];

    const normalizedImages = Array.isArray(editingListing.imageSrc)
      ? editingListing.imageSrc
      : typeof editingListing.imageSrc === 'string'
        ? [editingListing.imageSrc]
        : [];

    const normalizeInterval = (
      value: unknown,
    ): 'monthly' | 'yearly' | undefined => {
      if (value === 'yearly') return 'yearly';
      if (value === 'monthly') return 'monthly';
      return undefined;
    };

    const normalizedSubscriptionOptions = Array.isArray(editingListing.vinSubscriptionOptions)
      && editingListing.vinSubscriptionOptions.length > 0
      ? editingListing.vinSubscriptionOptions.map((option: any, index: number) =>
          buildSubscriptionOption({
            id: typeof option?.id === 'string' ? option.id : `option-${index + 1}`,
            label: typeof option?.label === 'string' ? option.label : 'Subscription plan',
            description: typeof option?.description === 'string' ? option.description : '',
            price: typeof option?.price === 'number' ? option.price : null,
            interval: normalizeInterval(option?.interval) ?? 'monthly',
          }),
        )
      : [
          buildSubscriptionOption({
            label: 'Subscription plan',
            description: '',
            price:
              typeof editingListing.vinSubscriptionPrice === 'number'
                ? editingListing.vinSubscriptionPrice
                : defaultFormValues.vinSubscriptionPrice ?? null,
            interval:
              normalizeInterval(editingListing.vinSubscriptionInterval) ??
              normalizeInterval(defaultFormValues.vinSubscriptionInterval) ??
              'monthly',
          }),
        ];

    return {
      formValues: {
        ...defaultFormValues,
        category: normalizedCategories,
        location: resolvedLocation,
        guestCount: editingListing.guestCount ?? defaultFormValues.guestCount,
        imageSrc: normalizedImages,
        title: editingListing.title ?? '',
        description: editingListing.description ?? '',
        price: editingListing.price ?? defaultFormValues.price,
        experienceHour: resolvedExperienceHour,
        hostDescription: editingListing.hostDescription ?? '',
        meetingPoint: editingListing.meetingPoint ?? '',
        languages: resolvedLanguages,
        locationType: resolvedLocationTypes,
        locationDescription: editingListing.locationDescription ?? '',
        groupStyles: resolvedGroupStyles,
        durationCategory: resolvedDuration,
        environments: resolvedEnvironments,
        activityForms: resolvedActivities,
        primarySeoKeyword: primaryKeywordOption ?? null,
        seoKeywords: additionalKeywordOptions,
        hoursInAdvance:
          typeof editingListing.hoursInAdvance === 'number'
            ? editingListing.hoursInAdvance
            : defaultFormValues.hoursInAdvance,
        availabilityRules: resolvedAvailability,
        pricingType: pricingMode,
        groupPrice: editingListing.groupPrice ?? null,
        groupSize: editingListing.groupSize ?? null,
        customPricing: normalizedCustomPricing,
        vinSubscriptionEnabled: Boolean(editingListing.vinSubscriptionEnabled),
        vinSubscriptionInterval:
          normalizeInterval(editingListing.vinSubscriptionInterval) ??
          normalizeInterval(defaultFormValues.vinSubscriptionInterval) ??
          'monthly',
        vinSubscriptionPrice:
          typeof editingListing.vinSubscriptionPrice === 'number'
            ? editingListing.vinSubscriptionPrice
            : defaultFormValues.vinSubscriptionPrice,
        vinSubscriptionTerms:
          typeof editingListing.vinSubscriptionTerms === 'string'
            ? editingListing.vinSubscriptionTerms
            : defaultFormValues.vinSubscriptionTerms,
        vinSubscriptionOptions: normalizedSubscriptionOptions,
      },
      locationQueryText:
        resolvedLocation
          ? `${resolvedLocation.city ? `${resolvedLocation.city}, ` : ''}${resolvedLocation.label}`
          : '',
    };
  }, [
    editingListing,
    defaultFormValues,
    allLocations,
    getByValue,
    flatLocationTypeOptions,
    buildSubscriptionOption
  ]);

  useEffect(() => {
    if (!editingHydration) {
      return;
    }

    reset(editingHydration.formValues, { keepDefaultValues: true });
    setLocationQuery(editingHydration.locationQueryText);
    setLocationError(false);
    setStep(STEPS.CATEGORY);
  }, [editingHydration, reset]);

  useEffect(() => {
      if (step === STEPS.LOCATION) {
        const id = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
        return () => clearTimeout(id);
      }
      return undefined;
    }, [step]);

    function usePrevious<T>(value: T) {
    const ref = useRef<T | null>(null);

    useEffect(() => { ref.current = value; }, [value]);
    return ref.current;
  }

  // Variants for step transitions (slide from left/right + fade)
  // const stepVariants = {
  //   enter: (direction: number) => ({
  //     opacity: 0,
  //     x: 20 * direction,   // small slide from the direction we came from
  //     filter: 'blur(4px)',
  //   }),
  //   center: {
  //     opacity: 1,
  //     x: 0,
  //     filter: 'blur(0px)',
  //     transition: { x: { type: 'spring', stiffness: 380, damping: 30, mass: 0.6 }, opacity: { duration: 0.18 } },
  //   },
  //   exit: (direction: number) => ({
  //     opacity: 0,
  //     x: -20 * direction,  // slide out opposite way
  //     filter: 'blur(4px)',
  //     transition: { duration: 0.16 },
  //   }),
  // };

  const prevStep = usePrevious(step);
  const direction = prevStep == null ? 1 : step > prevStep ? 1 : -1;

  const onBack = () => setStep((prev) => prev - 1);
  const onNext = () => setStep((prev) => prev + 1);

  const mergedAvailability = useMemo<ListingAvailabilityRules>(() => {
    return (
      normalizeAvailabilityRules(availabilityRules) ?? {
        defaultTimes: Array.from(DEFAULT_TIME_SLOTS),
        daysOfWeek: {},
        months: {},
        years: {},
        specificDates: {},
      }
    );
  }, [availabilityRules]);

  const updateAvailability = useCallback(
    (updater: (current: ListingAvailabilityRules) => ListingAvailabilityRules) => {
      const next = updater(mergedAvailability);
      setCustomValue('availabilityRules', next);
    },
    [mergedAvailability, setCustomValue],
  );

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    if (step === STEPS.CATEGORY) {
      if (!category || (Array.isArray(category) && category.length === 0)) {
        toast.error('Please select a category to continue.');
        return;
      }
      return onNext();
    }
  
    if (step === STEPS.LOCATION) {
      if (!location?.value) {
        setLocationError(true);
        searchInputRef.current?.focus();
        return;
      }
      return onNext();
    }
  
    if (step === STEPS.INFO1) {
      if (!data.hostDescription || data.guestCount < 1) {
        toast.error('Please fill in host description and guest count.');
        return;
      }
      return onNext();
    }
  
    if (step === STEPS.INFO2) {
      if (!data.experienceHour || !data.meetingPoint || !String(data.meetingPoint).trim()) {
        toast.error('Please provide duration and meeting point.');
        return;
      }
      return onNext();
    }
  
    if (step === STEPS.INFO3) {
      if (
        !data.languages || data.languages.length === 0 ||
        !data.locationType || data.locationType.length === 0 ||
        !data.locationDescription
      ) {
        toast.error('Please provide languages, location type, and description.');
        return;
      }
      return onNext();
    }

    if (step === STEPS.FILTERS) {
      const selectedGroupStyles = data.groupStyles
        ? Array.isArray(data.groupStyles)
          ? data.groupStyles.filter(Boolean)
          : [data.groupStyles]
        : [];
      const selectedEnvironments = Array.isArray(data.environments)
        ? data.environments.filter(Boolean)
        : [];
      const selectedActivityForms = Array.isArray(data.activityForms)
        ? data.activityForms.filter(Boolean)
        : [];
      const selectedDuration = data.durationCategory;

      if (
        selectedGroupStyles.length === 0 ||
        !selectedDuration ||
        selectedEnvironments.length === 0 ||
        selectedActivityForms.length === 0
      ) {
        toast.error('Please select group style, duration, environment, and activity form.');
        return;
      }

      if (!data.primarySeoKeyword) {
        toast.error('Choose a primary SEO keyword.');
        return;
      }

      return onNext();
    }

    // if (step === STEPS.IMAGES) {
    //   if (!imageSrc || !Array.isArray(imageSrc) || imageSrc.length === 0) {
    //     toast.error('Please upload at least one image or video.');
    //     return;
    //   }
    //   return onNext();
    // }

    if (step === STEPS.IMAGES) {
      bodyContent = (
        <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-1 pb-6">
          <Heading
            title="Upload photos and video"
            subtitle="Display your content! Up to 10 images and 1 video (max 30MB)"
          />

          {/* Wrapper bianco per separare chiaramente media e pulsanti del modal */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <ImageUpload
              maxImages={10}
              maxVideoSizeMB={30}
              value={imageSrc}
              onChange={(value: string[]) => setCustomValue('imageSrc', value)}
            />
          </div>
        </div>
      );
    }
  
    if (step === STEPS.DESCRIPTION) {
      if (!data.title || !data.description) {
        toast.error('Please provide a title and description.');
        return;
      }
      return onNext();
    }
  
    if (step === STEPS.PRICE) {
      const activePricingType: string = data.pricingType ?? PRICING_TYPES.FIXED;

      const ensurePositiveNumber = (value: any) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      };

      const fixedPrice = ensurePositiveNumber(data.price);

      if (activePricingType === PRICING_TYPES.FIXED) {
        if (!fixedPrice) {
          toast.error('Enter a valid price per person.');
          return;
        }
      }

      if (activePricingType === PRICING_TYPES.GROUP) {
        const parsedGroupPrice = ensurePositiveNumber(data.groupPrice);
        const parsedGroupSize = ensurePositiveNumber(data.groupSize);

        if (!parsedGroupSize) {
          toast.error('Specify how many guests are covered by the group price.');
          return;
        }

        if (!parsedGroupPrice) {
          toast.error('Enter a valid total group price.');
          return;
        }
      }

      if (activePricingType === PRICING_TYPES.CUSTOM) {
        const tiers: PricingTier[] = Array.isArray(customPricing)
          ? customPricing
          : [];

        if (!tiers.length) {
          toast.error('Add at least one custom pricing range.');
          return;
        }

        const hasInvalidTier = tiers.some((tier) => {
          const minGuests = ensurePositiveNumber(tier.minGuests);
          const maxGuests = ensurePositiveNumber(tier.maxGuests);
          const pricePerPerson = ensurePositiveNumber(tier.price);

          if (!minGuests || !maxGuests || !pricePerPerson) {
            return true;
          }

          return minGuests > maxGuests;
        });

        if (hasInvalidTier) {
          toast.error('Review your custom price ranges. Ensure guest counts and prices are valid.');
          return;
        }
      }

      const subscriptionOptions = Array.isArray(vinSubscriptionOptions)
        ? (vinSubscriptionOptions as VinSubscriptionOptionForm[])
        : [];

        const normalizedSubscriptionOptions = subscriptionOptions
        .map((option) => ({
          id: typeof option.id === 'string' && option.id.trim().length > 0
            ? option.id.trim()
            : `option-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          label: typeof option.label === 'string' ? option.label.trim() : '',
          description: typeof option.description === 'string' ? option.description.trim() : '',
          price: ensurePositiveNumber(option.price),
          interval: option.interval === 'yearly' ? 'yearly' : 'monthly',
        }))
        .filter((option) => option.label.length > 0 && option.price);

        if (vinSubscriptionEnabled) {
        if (normalizedSubscriptionOptions.length === 0) {
          const validInterval =
            typeof vinSubscriptionInterval === 'string' &&
            ['monthly', 'yearly'].includes(vinSubscriptionInterval);
          const parsedSubscriptionPrice = ensurePositiveNumber(vinSubscriptionPrice);

          if (!validInterval) {
            toast.error('Choose a valid VIN subscription interval.');
            return;
          }

          if (!parsedSubscriptionPrice) {
            toast.error('Enter a valid VIN subscription price.');
            return;
          }
        }
      }

      setIsLoading(true);

      const toValueArray = (value: any) => {
        if (!value) return [] as string[];
        const items = Array.isArray(value) ? value : [value];
        return items
          .map((item: any) => {
            const resolved = typeof item === 'string' ? item : item?.value || item?.label;
            return typeof resolved === 'string' ? resolved.trim() : '';
          })
          .filter((item): item is string => item.length > 0);
      };

      const durationValue =
        typeof data.durationCategory === 'string'
          ? data.durationCategory
          : data.durationCategory?.value ?? null;

      const experienceDuration =
        typeof data.experienceHour === 'string'
          ? Number(data.experienceHour)
          : Number(data.experienceHour?.value ?? 0);

      const parsedCustomPricing =
        activePricingType === PRICING_TYPES.CUSTOM
          ? (customPricing as PricingTier[]).map((tier) => ({
              minGuests: Number(tier.minGuests),
              maxGuests: Number(tier.maxGuests),
              price: Number(tier.price),
            }))
          : [];

      const groupPriceValue = ensurePositiveNumber(data.groupPrice);
      const groupSizeValue = ensurePositiveNumber(data.groupSize);

      const seoKeywordSet = new Set<string>();
      const rawPrimaryKeyword =
        typeof data.primarySeoKeyword === 'string'
          ? data.primarySeoKeyword
          : data.primarySeoKeyword?.value || data.primarySeoKeyword?.label;

      const normalizedPrimaryKeyword =
        typeof rawPrimaryKeyword === 'string' ? rawPrimaryKeyword.trim() : '';

      if (normalizedPrimaryKeyword) {
        seoKeywordSet.add(normalizedPrimaryKeyword);
      }

      toValueArray(data.seoKeywords).forEach((keyword) => seoKeywordSet.add(keyword));

      const computeBasePrice = () => {
        if (activePricingType === PRICING_TYPES.FIXED) {
          return Number(fixedPrice ?? 0);
        }

        if (activePricingType === PRICING_TYPES.GROUP) {
          return Number(groupPriceValue ?? 0);
        }

        if (parsedCustomPricing.length > 0) {
          return parsedCustomPricing[0].price;
        }

        return Number(data.price ?? 0);
      };

      const normalizedCategory = Array.isArray(data.category)
        ? data.category.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
        : typeof data.category === 'string' && data.category.trim().length > 0
          ? [data.category.trim()]
          : [];

      const uniqueStrings = (values: string[]) => Array.from(new Set(values));

      const sanitizedLanguages = uniqueStrings(toValueArray(data.languages));
      const sanitizedLocationTypes = uniqueStrings(toValueArray(data.locationType));
      const sanitizedGroupStyles = uniqueStrings(toValueArray(data.groupStyles));
      const sanitizedEnvironments = uniqueStrings(toValueArray(data.environments));
      const sanitizedActivityForms = uniqueStrings(toValueArray(data.activityForms));

      const sortedCustomPricing =
        activePricingType === PRICING_TYPES.CUSTOM && parsedCustomPricing.length > 0
          ? [...parsedCustomPricing].sort((a, b) => a.minGuests - b.minGuests)
          : [];

      const normalizedAvailability = normalizeAvailabilityRules(availabilityRules) ?? null;

      const resolvedSubscriptionInterval = vinSubscriptionEnabled
        ? normalizedSubscriptionOptions[0]?.interval ?? vinSubscriptionInterval
        : null;
      const resolvedSubscriptionPrice = vinSubscriptionEnabled
        ? normalizedSubscriptionOptions[0]?.price ?? ensurePositiveNumber(vinSubscriptionPrice)
        : null;

      const submissionData = {
        title: typeof data.title === 'string' ? data.title.trim() : '',
        description: typeof data.description === 'string' ? data.description.trim() : '',
        hostDescription: typeof data.hostDescription === 'string' ? data.hostDescription.trim() : '',
        imageSrc: Array.isArray(imageSrc)
          ? imageSrc.filter((src) => typeof src === 'string' && src.trim().length > 0)
          : [],
        category: normalizedCategory,
        guestCount: (() => {
          const parsed = Math.round(Number(data.guestCount ?? 1));
          return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
        })(),
        location,
        price: Math.round(Number(computeBasePrice()) || 0),
        experienceHour:
          Number.isFinite(experienceDuration) && experienceDuration > 0
            ? experienceDuration
            : null,
        meetingPoint: typeof data.meetingPoint === 'string' ? data.meetingPoint.trim() : '',
        hoursInAdvance: Math.max(0, Math.round(Number(data.hoursInAdvance ?? 0))),
        languages: sanitizedLanguages,
        locationType: sanitizedLocationTypes,
        locationDescription:
          typeof data.locationDescription === 'string' ? data.locationDescription.trim() : '',
        groupStyles: sanitizedGroupStyles,
        durationCategory: typeof durationValue === 'string' ? durationValue : null,
        environments: sanitizedEnvironments,
        activityForms: sanitizedActivityForms,
        seoKeywords: Array.from(seoKeywordSet)
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword.length > 0),
        primarySeoKeyword: normalizedPrimaryKeyword || null,
        pricingType: activePricingType,
        groupPrice:
          activePricingType === PRICING_TYPES.GROUP && groupPriceValue
            ? Math.round(groupPriceValue)
            : null,
        groupSize:
          activePricingType === PRICING_TYPES.GROUP && groupSizeValue
            ? Math.round(groupSizeValue)
            : null,
        customPricing:
          activePricingType === PRICING_TYPES.CUSTOM && sortedCustomPricing.length > 0
            ? sortedCustomPricing.map((tier) => ({
                minGuests: Math.max(1, Math.round(tier.minGuests)),
                maxGuests: Math.max(1, Math.round(tier.maxGuests)),
                price: Math.max(1, Math.round(tier.price)),
              }))
            : null,
        availabilityRules: normalizedAvailability,
        vinSubscriptionEnabled: Boolean(vinSubscriptionEnabled),
        vinSubscriptionInterval: resolvedSubscriptionInterval,
        vinSubscriptionPrice:
          typeof resolvedSubscriptionPrice === 'number' && resolvedSubscriptionPrice > 0
            ? Math.round(resolvedSubscriptionPrice)
            : null,
        vinSubscriptionTerms:
          vinSubscriptionEnabled && typeof vinSubscriptionTerms === 'string'
            ? vinSubscriptionTerms.trim()
            : '',
        vinSubscriptionOptions: vinSubscriptionEnabled ? normalizedSubscriptionOptions : [],
      };

      const request = isEditing && editingListing
        ? axios.patch(`/api/listings/${editingListing.id}`, submissionData)
        : axios.post('/api/listings', submissionData);

      request
        .then((response) => {
          toast.success(
            isEditing
              ? 'Listing updates submitted for review'
              : 'Listing submitted for review',
            {
            iconTheme: {
              primary: '#2200ffff',
              secondary: '#fff',
            },
          });
          reset(defaultFormValues);
          setLocationQuery('');
          router.refresh();
          const listingId = editingListing?.id ?? response?.data?.id;
          if (onCompleted) {
            onCompleted(listingId);
          } else {
            router.push('/my-listings');
          }
          setStep(STEPS.CATEGORY);
        })
        .catch(() => toast.error('Something went wrong.'))
        .finally(() => setIsLoading(false));
    }
  };  
  
  const actionLabel = useMemo(() => {
    if (step === STEPS.PRICE) {
      return isEditing ? 'Submit updates' : 'Create';
    }

    return 'Next';
  }, [step, isEditing]);

  const stepsMeta = [
    { id: STEPS.CATEGORY, title: 'Category', description: 'Experience type', icon: FiList },
    { id: STEPS.LOCATION, title: 'Location', description: 'Where it happens', icon: FiMapPin },
    { id: STEPS.INFO1, title: 'Details', description: 'Group basics', icon: FiUsers },
    { id: STEPS.INFO2, title: 'Logistics', description: 'Duration & meeting point', icon: FiClock },
    { id: STEPS.INFO3, title: 'Languages', description: 'Accessibility', icon: FiGlobe },
    { id: STEPS.FILTERS, title: 'Filters', description: 'Match the right guests', icon: FiSliders },
    { id: STEPS.IMAGES, title: 'Media', description: 'Photos & video', icon: FiImage },
    { id: STEPS.DESCRIPTION, title: 'Story', description: 'Describe the experience', icon: FiFileText },
    { id: STEPS.PRICE, title: 'Pricing', description: 'How guests pay', icon: FiDollarSign },
  ] as const;

  const currentStepIndex = stepsMeta.findIndex((item) => item.id === step);
  const isFirstStep = step === STEPS.CATEGORY;

  const secondaryLabel = isFirstStep
    ? onCancel
      ? isEditing
        ? 'Exit without saving'
        : 'Cancel'
      : undefined
    : 'Back';

  const heading = headingOverride ?? {
    title: isEditing ? 'Update your experience' : 'Become a Vuola partner',
    subtitle: isEditing
      ? 'Review each section to make sure your activity stays accurate for travellers.'
      : 'Complete every section to publish a compelling experience and start hosting.',
  };

  const hasSavedDrafts = savedDrafts.length > 0;

  const handleStepSelect = (target: STEPS) => {
    if (target <= step) {
      setStep(target);
    }
  };

  const handleSecondaryClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isFirstStep) {
      onBack();
      return;
    }

    if (secondaryLabel && onCancel) {
      onCancel();
    }
  };

  const handleSaveDraft = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!currentUser) {
      toast.error('Please sign in to save your draft.');
      return;
    }

    setIsSavingDraft(true);

    try {
      const values = getValues();
      const titleValue =
        typeof values.title === 'string' && values.title.trim().length > 0
          ? values.title.trim()
          : null;

      const response = await axios.post('/api/listings/drafts', {
        draftId,
        title: titleValue,
        step,
        data: values,
      });

      const saved = response.data as ListingDraftSummary;
      setDraftId(saved.id);
      setSavedDrafts((prev) => {
        const filtered = prev.filter((draft) => draft.id !== saved.id);
        return [saved, ...filtered];
      });
      toast.success('Saved for later.');
      if (onCancel) {
        onCancel();
      } else {
        router.push('/my-listings');
      }
    } catch (error) {
      console.error('Failed to save draft', error);
      toast.error('Unable to save your draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDraftSelect = (draft: ListingDraftSummary) => {
    const draftData = draft.data ?? {};
    const mergedValues = {
      ...defaultFormValues,
      ...draftData,
    };

    reset(mergedValues);
    setDraftId(draft.id);

    const targetStep =
      typeof draft.step === 'number' && draft.step >= 0
        ? Math.min(draft.step, stepsMeta.length - 1)
        : STEPS.CATEGORY;

    const draftLocation =
      typeof mergedValues.location === 'object' && mergedValues.location
        ? (mergedValues.location as { label?: string; city?: string })
        : null;

    if (draftLocation) {
      setLocationQuery(
        `${draftLocation.city ? `${draftLocation.city}, ` : ''}${draftLocation.label ?? ''}`.trim(),
      );
    }

    setIsSavedServicesOpen(false);
    requestAnimationFrame(() => {
      setStep(targetStep);
    });
  };

  // const handlePrimaryClick = (event: MouseEvent<HTMLButtonElement>) => {
  //   event.preventDefault();
  //   void handleSubmit(onSubmit)();
  // };

  // ⬇️ Add this helper (place above handlePrimaryClick)
  const nextStepGuard = () => {
    // CATEGORY → LOCATION
    if (step === STEPS.CATEGORY) {
      if (!Array.isArray(category) || category.length === 0) {
        toast.error('Please select a category to continue.');
        return;
      }
      setStep(STEPS.LOCATION);
      return;
    }

    // LOCATION → INFO1
    if (step === STEPS.LOCATION) {
      if (!location?.value) {
        setLocationError(true);
        searchInputRef.current?.focus();
        return;
      }
      setStep(STEPS.INFO1);
      return;
    }

    // INFO1 → INFO2
    if (step === STEPS.INFO1) {
      const hostDesc = watch('hostDescription');
      const guests = Number(watch('guestCount') ?? 0);
      if (!hostDesc || guests < 1) {
        toast.error('Please fill in host description and guest count.');
        return;
      }
      setStep(STEPS.INFO2);
      return;
    }

    // INFO2 → INFO3
    if (step === STEPS.INFO2) {
      const exp = watch('experienceHour');
      const mp  = watch('meetingPoint');
      if (!exp || !mp || !String(mp).trim()) {
        toast.error('Please provide duration and meeting point.');
        return;
      }
      setStep(STEPS.INFO3);
      return;
    }

    // INFO3 → FILTERS
    if (step === STEPS.INFO3) {
      const langs = watch('languages') ?? [];
      const locTypes = watch('locationType') ?? [];
      const locDesc = watch('locationDescription');
      if (!langs.length || !locTypes.length || !locDesc) {
        toast.error('Please provide languages, location type, and description.');
        return;
      }
      setStep(STEPS.FILTERS);
      return;
    }

    // FILTERS → IMAGES
    if (step === STEPS.FILTERS) {
      const gs = watch('groupStyles');
      const dur = watch('durationCategory');
      const env = watch('environments');
      const act = watch('activityForms');
      const primary = watch('primarySeoKeyword');
      const len = (v: any) => (Array.isArray(v) ? v.length : v ? 1 : 0);
      if (!len(gs) || !dur || !len(env) || !len(act)) {
        toast.error('Please select group style, duration, environment, and activity form.');
        return;
      }
      if (!primary) {
        toast.error('Choose a primary SEO keyword.');
        return;
      }
      setStep(STEPS.IMAGES);
      return;
    }

    // IMAGES → DESCRIPTION
    if (step === STEPS.IMAGES) {
      if (!imageSrc || !Array.isArray(imageSrc) || imageSrc.length === 0) {
        toast.error('Please upload at least one image or video.');
        return;
      }
      setStep(STEPS.DESCRIPTION);
      return;
    }

    // DESCRIPTION → PRICE
    if (step === STEPS.DESCRIPTION) {
      const title = watch('title');
      const desc  = watch('description');
      if (!title || !desc) {
        toast.error('Please provide a title and description.');
        return;
      }
      setStep(STEPS.PRICE);
      return;
    }

    // PRICE → submit via RHF
    if (step === STEPS.PRICE) {
      void handleSubmit(onSubmit)();
    }
  };

  // ⬇️ Replace handlePrimaryClick with this
  const handlePrimaryClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    nextStepGuard();
  };

  const showSaveDraft = !isEditing;

  let bodyContent: JSX.Element = <div />;

  if (step === STEPS.CATEGORY) {
    bodyContent = (
      <div className="flex flex-col gap-6">
        <Heading
          title="What type of experience are you offering?"
          subtitle="Select one category to continue"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 max-h-[55vh] md:max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((item) => {
            const isSelected = Array.isArray(category) && category.includes(item.label);

            return (
              <CategoryInput
                key={item.label}
                onClick={() => {
                  const updated = [item.label];
                  setCustomValue('category', updated);
                }}
                selected={isSelected}
                label={item.label}
                icon={item.icon}
              />
            );
          })}
        </div>
      </div>
    );
  }
 
  if (step === STEPS.LOCATION) {
    bodyContent = (
      <div className="grid grid-cols-1 gap-4 max-h-[40vh] md:max-h-[60vh] overflow-y-auto pr-1">
        <Heading title="Where is your event located?" subtitle="Choose a location" />

        <CountrySearchSelect
          ref={searchInputRef}
          value={location}
          onChange={(value) => {
            setCustomValue('location', value);
            setLocationError(false);
          }}
          hasError={locationError}
          onErrorCleared={() => setLocationError(false)}
        />

        <div className="pt-4">
          <div className="relative w-full overflow-hidden rounded-2xl border border-neutral-200">
            <div className="h-60 sm:h-64 md:h-72 lg:h-80">
              <SearchMap
                key={`map-${editingListing?.id ?? 'new'}-${location?.value ?? 'default'}`}
                city={location?.city ?? 'Rome'}
                country={location?.label ?? 'Italy'}
                center={
                  (location?.latlng as [number, number]) ??
                  ([41.9028, 12.4964] as [number, number])
                }
                allowFullscreen
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.INFO1) {
    bodyContent = (
      <div className="flex flex-col gap-8 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <Heading title="Experience details" subtitle="Tell us about your event style and group size" />
        <Input
          id="hostDescription"
          label="Describe your experience as a host"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
          maxLength={300}
          textarea // ← already stylized for pasting
        />
        <Counter
          title="Guests"
          subtitle="Maximum number of guests"
          value={guestCount}
          onChange={(value) => setCustomValue('guestCount', value)}
        />
      </div>
    );
  }

  if (step === STEPS.INFO2) {
    bodyContent = (
      <div className="flex flex-col gap-8 min-h-[80vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <Heading title="Event logistics" subtitle="Duration and meeting point" />
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">How long is your experience?</label>
          <Select
            options={hourOptions}
            value={watch('experienceHour')}
            onChange={(value: any) => setCustomValue('experienceHour', value)}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">How much advance notice do you need?</label>
          <Select
            options={hoursNoticeOptions}
            value={hoursNoticeOptions.find((option) => option.value === Number(hoursInAdvance))}
            onChange={(value: any) => setCustomValue('hoursInAdvance', Number(value?.value ?? 0))}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white/70 p-4 shadow-sm">
          <div>
            <p className="text-md font-medium">When can guests book?</p>
            <p className="text-sm text-neutral-600">Set the exact time slots you want to offer. Guests will only be able to pick these on the calendar.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Default time slots</label>
            <CreatableSelect
              isMulti
              options={timeSlotOptions}
              value={toSelectValues(mergedAvailability.defaultTimes)}
              onChange={(values) => {
                const times = extractTimes(values as any[]);
                updateAvailability((current) => ({
                  ...current,
                  defaultTimes: times.length > 0 ? times : Array.from(DEFAULT_TIME_SLOTS),
                }));
              }}
              placeholder="Add times like 09:00 or 2:30 PM"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Weekly availability</p>
              <span className="text-xs text-neutral-500">Choose different hours per weekday if needed.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weekdayLabels.map((label, index) => (
                <div key={label} className="flex flex-col gap-1 rounded-lg border border-neutral-100 bg-neutral-50/70 p-3">
                  <span className="text-xs font-semibold text-neutral-700">{label}</span>
                  <CreatableSelect
                    isMulti
                    options={timeSlotOptions}
                    value={toSelectValues(mergedAvailability.daysOfWeek?.[index.toString()])}
                    onChange={(values) => {
                      const times = extractTimes(values as any[]);
                      updateAvailability((current) => ({
                        ...current,
                        daysOfWeek: {
                          ...(current.daysOfWeek ?? {}),
                          [index]: times,
                        },
                      }));
                    }}
                    placeholder="Use default"
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50/70 p-3">
              <label className="text-sm font-semibold">Date-specific slots</label>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={specificDateInput}
                  onChange={(e) => setSpecificDateInput(e.target.value)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
                <CreatableSelect
                  isMulti
                  options={timeSlotOptions}
                  value={specificDateTimes}
                  onChange={(values) => setSpecificDateTimes(values as any[])}
                  placeholder="Pick times for this date"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
                <Button label="Save date slots" onClick={saveSpecificDateTimes} small />
                {Object.entries(mergedAvailability.specificDates ?? {}).length > 0 && (
                  <div className="mt-1 flex gap-2 overflow-x-auto pb-1 text-xs text-neutral-600">
                    {Object.entries(mergedAvailability.specificDates ?? {}).map(([date, times]) => (
                      <div
                        key={date}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-100 px-3 py-1"
                      >
                        <span className="font-semibold whitespace-nowrap">{date}</span>
                        <span className="whitespace-nowrap">{times.map(formatTimeLabel).join(', ')}</span>
                        <button
                          type="button"
                          onClick={() => removeSpecificDate(date)}
                          className="ml-1 text-[11px] leading-none font-bold text-neutral-500 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50/70 p-3">
                <label className="text-sm font-semibold">Month-specific slots</label>
                <input
                  type="month"
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
                <CreatableSelect
                  isMulti
                  options={timeSlotOptions}
                  value={monthTimes}
                  onChange={(values) => setMonthTimes(values as any[])}
                  placeholder="Times for this month"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
                <Button label="Save month slots" onClick={saveMonthTimes} small />
                {Object.entries(mergedAvailability.months ?? {}).length > 0 && (
                  <div className="mt-1 flex gap-2 overflow-x-auto pb-1 text-xs text-neutral-600">
                    {Object.entries(mergedAvailability.months ?? {}).map(([month, times]) => (
                      <div
                        key={month}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-100 px-3 py-1"
                      >
                        <span className="font-semibold whitespace-nowrap">{month}</span>
                        <span className="whitespace-nowrap">{times.map(formatTimeLabel).join(', ')}</span>
                        <button
                          type="button"
                          onClick={() => removeMonth(month)}
                          className="ml-1 text-[11px] leading-none font-bold text-neutral-500 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50/70 p-3">
                <label className="text-sm font-semibold">Year-specific slots</label>
                <input
                  type="number"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  placeholder="e.g. 2026"
                  min={new Date().getFullYear()}
                />
                <CreatableSelect
                  isMulti
                  options={timeSlotOptions}
                  value={yearTimes}
                  onChange={(values) => setYearTimes(values as any[])}
                  placeholder="Times for this year"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
                <Button label="Save year slots" onClick={saveYearTimes} small />
                {Object.entries(mergedAvailability.years ?? {}).length > 0 && (
                  <div className="mt-1 flex gap-2 overflow-x-auto pb-1 text-xs text-neutral-600">
                    {Object.entries(mergedAvailability.years ?? {}).map(([year, times]) => (
                      <div
                        key={year}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-100 px-3 py-1"
                      >
                        <span className="font-semibold whitespace-nowrap">{year}</span>
                        <span className="whitespace-nowrap">{times.map(formatTimeLabel).join(', ')}</span>
                        <button
                          type="button"
                          onClick={() => removeYear(year)}
                          className="ml-1 text-[11px] leading-none font-bold text-neutral-500 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        <Controller
          control={control}
          name="meetingPoint"
          rules={{ required: 'Please choose a meeting point.' }}
          render={({ field, fieldState }) => (
            <MeetingPointAutocomplete
              value={field.value as string}
              onChange={field.onChange}
              disabled={isLoading}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </div>
    );
  }

  if (step === STEPS.INFO3) {
    bodyContent = (
      <div className="flex flex-col gap-8 max-h-[40vh] md:max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <Heading title="Languages and location" subtitle="Help guests know what to expect" />

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Which languages can you provide the experience in?</label>
          <Select
            options={languageOptions}
            value={watch('languages')}
            onChange={(value: any) => setCustomValue('languages', value)}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
              placeholder: (base) => ({
                ...base,
                fontSize: '0.875rem', // text-sm
              }),
            }}
            isMulti
          />
        </div>
  
        <label className="text-md font-medium">Location type</label>
        <Select
          placeholder="What type of location is it? (up to 3)"
          options={locationTypeOptions}
          value={watch('locationType')}
          onChange={(selected: any) => {
            if (selected.length <= 3) {
              setCustomValue('locationType', selected);
            }
          }}
          isMulti
          closeMenuOnSelect={false}
          maxMenuHeight={250}
          isOptionDisabled={() => watch('locationType')?.length >= 3}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            menu: (base) => ({ ...base, zIndex: 9999 }),
            placeholder: (base) => ({
              ...base,
              fontSize: '0.875rem', // text-sm
            }),
          }}
        />
  
        <Input
          id="locationDescription"
          label="Describe the location"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
          maxLength={300}
          textarea
        />
      </div>
    );
  }

  if (step === STEPS.FILTERS) {
    bodyContent = (
      <div className="flex flex-col gap-8 max-h-[40vh] md:max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <Heading
          title="Categorise your listing"
          subtitle="Match your experience with the right audience and improve discovery."
        />

        {/* Group style (multi-select) */}
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Group style</label>
          <Select
            options={groupStyleOptions}
            value={groupStyles}
            onChange={(selected: any) => setCustomValue('groupStyles', selected)}
            placeholder="Choose one or more styles"
            isMulti
            closeMenuOnSelect={false}
            menuPlacement="auto"
            maxMenuHeight={260}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
          <p className="text-xs text-neutral-500">
            Pick all styles that fit your experience.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Duration</label>
          <Select
            options={durationCategoryOptions}
            value={durationCategory}
            onChange={(value: any) => setCustomValue('durationCategory', value)}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Environment</label>
          <Select
            options={environmentOptions}
            value={environments}
            onChange={(value: any) => setCustomValue('environments', value)}
            isMulti
            closeMenuOnSelect={false}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Activity form</label>
          <Select
            options={activityFormOptions}
            value={activityForms}
            onChange={(value: any) => setCustomValue('activityForms', value)}
            isMulti
            closeMenuOnSelect={false}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Primary SEO keyword</label>
          <Select
            options={seoKeywordOptions}
            value={primarySeoKeyword}
            onChange={(value: any) => setCustomValue('primarySeoKeyword', value)}
            placeholder="Select the main keyword"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Additional keywords (optional)</label>
          <CreatableSelect
            isMulti
            options={seoKeywordOptions}
            value={seoKeywords}
            onChange={(value: any) => setCustomValue('seoKeywords', value)}
            placeholder="Add supporting keywords"
            formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
          <p className="text-xs text-neutral-500">Use extra tags to help travellers find you. They are optional.</p>
        </div>
      </div>
    );
  }

  if (step === STEPS.IMAGES) {
    bodyContent = (
      <div className="flex flex-col gap-8 max-h-[500px]">
        <Heading
          title="Upload photos and video"
          subtitle="Display your content! Up to 10 images and 1 video (max 30MB)"
        />
        <ImageUpload
          maxImages={10}
          maxVideoSizeMB={30}
          value={imageSrc}
          onChange={(value: string[]) => setCustomValue('imageSrc', value)}
        />
      </div>
    );
  }

  if (step === STEPS.DESCRIPTION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading title="Describe your event" subtitle="Make it exciting and fun!" />
        <Input
          id="title"
          label="Experience Headline"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <Input
          id="description"
          label="Share an engaging description about your event"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
          textarea
        />
      </div>
    );
  }

  if (step === STEPS.PRICE) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Pricing"
          subtitle="Choose how guests will be charged for your experience"
        />

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-neutral-700">Pricing mode</span>

          {/* Stagger the three pricing cards */}
          <motion.div
            className="grid gap-3 sm:grid-cols-3"
            variants={containerStagger}
            initial="hidden"
            animate="show"
          >
            {[
              { key: PRICING_TYPES.FIXED,  title: 'Fixed price',  description: 'Same price for every guest' },
              { key: PRICING_TYPES.GROUP,  title: 'Group pricing', description: 'Charge one amount for a private group' },
              { key: PRICING_TYPES.CUSTOM, title: 'Custom ranges', description: 'Set different prices for guest ranges' },
            ].map((option) => {
              const isActive = pricingType === option.key;
              return (
                <motion.button
                  key={option.key}
                  type="button"
                  onClick={() => setCustomValue('pricingType', option.key)}
                  aria-pressed={isActive}
                  variants={itemFade}
                  whileTap={{ scale: 0.98 }}
                  className={clsx(
                    'rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-black/20',
                    isActive
                      ? 'border-black bg-white shadow-lg shadow-black/10'
                      : 'border-neutral-200 bg-white/80 hover:border-black/30',
                  )}
                >
                  <h3 className="text-base font-semibold text-neutral-900">{option.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{option.description}</p>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Cross-fade/slide the pricing content based on pricingType */}
        <AnimatePresence mode="wait">
          {pricingType === PRICING_TYPES.FIXED && (
            <motion.div
              key="pricing-fixed"
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <Input
                id="price"
                label="Price per person"
                type="number"
                formatPrice
                disabled={isLoading}
                register={register}
                errors={errors}
                required={pricingType === PRICING_TYPES.FIXED}
                inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </motion.div>
          )}

          {pricingType === PRICING_TYPES.GROUP && (
            <motion.div
              key="pricing-group"
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="grid gap-4 sm:grid-cols-2"
            >
              <Input
                id="groupSize"
                name="groupSize"
                label="Guests included"
                type="number"
                disabled={isLoading}
                register={register}
                errors={errors}
                required={pricingType === PRICING_TYPES.GROUP}
                inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Input
                id="groupPrice"
                name="groupPrice"
                label="Total price for the group"
                type="number"
                formatPrice
                disabled={isLoading}
                register={register}
                errors={errors}
                required={pricingType === PRICING_TYPES.GROUP}
                inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </motion.div>
          )}

          {pricingType === PRICING_TYPES.CUSTOM && (
            <motion.div
              key="pricing-custom"
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-4"
            >
              <p className="text-sm text-neutral-600">
                Create price tiers for different group sizes. Guests will see the range that applies to their party.
              </p>

              <motion.div
                className="flex flex-col gap-4"
                variants={containerStagger}
                initial="hidden"
                animate="show"
              >
                {customPricingFields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    variants={itemFade}
                    className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        id={`custom-tier-${index}-min`}
                        name={`customPricing.${index}.minGuests`}
                        label="From guests"
                        type="number"
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        required={pricingType === PRICING_TYPES.CUSTOM}
                        inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Input
                        id={`custom-tier-${index}-max`}
                        name={`customPricing.${index}.maxGuests`}
                        label="To guests"
                        type="number"
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        required={pricingType === PRICING_TYPES.CUSTOM}
                        inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Input
                        id={`custom-tier-${index}-price`}
                        name={`customPricing.${index}.price`}
                        label="Price per person"
                        type="number"
                        formatPrice
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        required={pricingType === PRICING_TYPES.CUSTOM}
                        inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {customPricingFields.length > 1 && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removePricingTier(index)}
                          className="text-sm font-semibold text-rose-500 hover:text-rose-600"
                        >
                          Remove tier
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const lastTier = Array.isArray(customPricing) && customPricing.length > 0
                    ? customPricing[customPricing.length - 1]
                    : null;

                  appendPricingTier({
                    minGuests: Math.max(1, Number(lastTier?.maxGuests ?? 1) + 1),
                    maxGuests: Math.max(1, Number(lastTier?.maxGuests ?? 1) + 1),
                    price: Number(lastTier?.price ?? price ?? 100),
                  });
                }}
                className="self-start rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
              >
                Add another range
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl border border-neutral-200 bg-white/90 p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">VIN subscription</h3>
                <p className="text-sm text-neutral-500">
                  Offer subscription plans with billing cadence, pricing, and terms for this experience.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomValue('vinSubscriptionEnabled', !vinSubscriptionEnabled)}
                className={clsx(
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                  vinSubscriptionEnabled
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400',
                )}
                aria-pressed={vinSubscriptionEnabled}
              >
                {vinSubscriptionEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {vinSubscriptionEnabled && (
                <motion.div
                  key="vin-subscription-settings"
                  variants={panelVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="space-y-4"
                >
                  <Input
                    id="vinSubscriptionTerms"
                    name="vinSubscriptionTerms"
                    label="Terms & conditions"
                    textarea
                    disabled={isLoading}
                    register={register}
                    errors={errors}
                  />

                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold text-neutral-700">Subscription plans</span>
                    <div className="space-y-4">
                      {vinSubscriptionOptionFields.map((field, index) => {
                        const currentInterval =
                          Array.isArray(vinSubscriptionOptions) && vinSubscriptionOptions[index]?.interval === 'yearly'
                            ? 'yearly'
                            : 'monthly';
                        return (
                          <motion.div
                            key={field.id}
                            variants={itemFade}
                            className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm"
                          >
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Input
                                id={`vinSubscriptionOptions.${index}.label`}
                                name={`vinSubscriptionOptions.${index}.label`}
                                label="Plan name"
                                disabled={isLoading}
                                register={register}
                                errors={errors}
                                required={vinSubscriptionEnabled}
                              />
                              <Input
                                id={`vinSubscriptionOptions.${index}.price`}
                                name={`vinSubscriptionOptions.${index}.price`}
                                label="Price"
                                type="number"
                                formatPrice
                                disabled={isLoading}
                                register={register}
                                errors={errors}
                                required={vinSubscriptionEnabled}
                                inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>

                            <div className="mt-3 flex flex-col gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                Billing interval
                              </span>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {subscriptionIntervalOptions.map((option) => {
                                  const isActive = currentInterval === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() =>
                                        setCustomValue(`vinSubscriptionOptions.${index}.interval`, option.value)
                                      }
                                      className={clsx(
                                        'rounded-2xl border p-3 text-left text-sm shadow-sm transition',
                                        isActive
                                          ? 'border-black bg-white shadow-md shadow-black/10'
                                          : 'border-neutral-200 bg-white/80 hover:border-black/30',
                                      )}
                                    >
                                      <p className="text-sm font-semibold text-neutral-900">{option.label}</p>
                                      <p className="text-xs text-neutral-500">{option.description}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="mt-3">
                              <Input
                                id={`vinSubscriptionOptions.${index}.description`}
                                name={`vinSubscriptionOptions.${index}.description`}
                                label="Plan description"
                                textarea
                                disabled={isLoading}
                                register={register}
                                errors={errors}
                              />
                            </div>

                            {vinSubscriptionOptionFields.length > 1 && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeVinSubscriptionOption(index)}
                                  className="text-sm font-semibold text-rose-500 hover:text-rose-600"
                                >
                                  Remove plan
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => appendVinSubscriptionOption(buildSubscriptionOption({ label: 'New plan', price: 20 }))}
                      className="self-start rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
                    >
                      Add another plan
                    </motion.button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
      </div>
    );
  }

  return (
    <div className="pageadjust py-10 sm:py-14">
      <div className="md:px-14 flex w-full flex-col gap-8 px-4 lg:flex-row">
        <aside className="hidden w-full max-w-xs shrink-0 lg:block">
          <div className="lg:sticky lg:top-32">
            <nav className="flex flex-col gap-2 overflow-y-auto pr-1 lg:h-full lg:overflow-visible">
              {stepsMeta.map((item, index) => {
                const Icon = item.icon;
                const status = index < currentStepIndex
                  ? 'complete'
                  : index === currentStepIndex
                    ? 'current'
                    : 'upcoming';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleStepSelect(item.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-2xl border bg-white/95 p-3 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-black/80',
                      status === 'current' && 'border-black shadow-md',
                      status === 'complete' && 'border-black text-black hover:border-black-400',
                      status === 'upcoming' && 'border-neutral-200 text-neutral-400 hover:border-neutral-300'
                    )}
                    disabled={status === 'upcoming'}
                  >
                    <span
                      className={clsx(
                        'flex h-9 w-9 items-center justify-center rounded-full text-base',
                        status === 'current' && 'border-black bg-black text-white',
                        status === 'complete' && 'shadow-md text-black',
                        status === 'upcoming' && 'border-neutral-200 text-neutral-400'
                      )}
                    >
                      <Icon />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Step {index + 1}</span>
                      <span className="text-sm font-semibold text-neutral-800">{item.title}</span>
                      <span className="text-xs text-neutral-500">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 space-y-6 p-8 shadow-md rounded-xl">
         {hasSavedDrafts && (
            <section className="rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
              <button
                type="button"
                onClick={() => setIsSavedServicesOpen((prev) => !prev)}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-neutral-900">Saved services</h2>
                  <p className="text-sm text-neutral-500">
                    Pick up where you left off or keep track of draft experiences you are still building.
                  </p>
                </div>
                <span className="text-sm font-semibold text-neutral-500">
                  {isSavedServicesOpen ? 'Hide' : 'Show'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isSavedServicesOpen && (
                  <motion.div
                    className="mt-4 grid gap-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {savedDrafts.map((draft) => {
                      const fallbackTitle =
                        typeof draft.data?.title === 'string' && draft.data.title.trim().length > 0
                          ? draft.data.title.trim()
                          : 'Untitled experience';
                      const displayTitle = draft.title ?? fallbackTitle;
                      const updatedLabel = draft.updatedAt
                        ? new Date(draft.updatedAt).toLocaleString()
                        : 'Just now';

                      return (
                        <button
                          key={draft.id}
                          type="button"
                          onClick={() => handleDraftSelect(draft)}
                          className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-neutral-900">{displayTitle}</p>
                              <p className="text-xs text-neutral-500">Last saved {updatedLabel}</p>
                            </div>
                            {draft.step !== null && draft.step !== undefined && (
                              <span className="text-xs font-semibold text-neutral-500">
                                Step {draft.step + 1} of {stepsMeta.length}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
          <div className="lg:hidden">
            <div className="-mx-4 flex gap-3 pb-8 md:pb-0 overflow-x-auto px-4 pb-2">
              {stepsMeta.map((item, index) => {
                const Icon = item.icon;
                const status = index < currentStepIndex
                  ? 'complete'
                  : index === currentStepIndex
                    ? 'current'
                    : 'upcoming';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleStepSelect(item.id)}
                    className={clsx(
                      'flex min-w-[170px] flex-col items-start gap-2 rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-black/80',
                      status === 'current' && 'border-black shadow-lg',
                      status === 'complete' && 'border-black text-black',
                      status === 'upcoming' && 'border-neutral-200 text-neutral-400'
                    )}
                    disabled={status === 'upcoming'}
                  >
                    <span
                      className={clsx(
                        'flex h-9 w-9 items-center justify-center rounded-full border text-base',
                        status === 'current' && 'border-black bg-black text-white',
                        status === 'complete' && 'border-black text-black',
                        status === 'upcoming' && 'border-neutral-200 text-neutral-400'
                      )}
                    >
                      <Icon />
                    </span>
                    <span className="text-sm font-semibold">{item.title}</span>
                    <span className="text-xs text-neutral-500">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <header className="space-y-2">
            <Heading title={heading.title} subtitle={heading.subtitle} />
            <p className="text-sm text-neutral-500">
              Step {currentStepIndex + 1} of {stepsMeta.length}
            </p>
          </header>

          <div
            className={clsx(
              'rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8',
              step === STEPS.IMAGES ? 'h-screen' : 'h-fit'
            )}
          >
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={step}                  // important: change on step
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="min-h-[320px]"   // reserve space to reduce layout jump; tweak to your avg step height
              >
                {bodyContent}
                </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
            {secondaryLabel && (
              <div className="w-full sm:flex-1">
                <Button
                  outline
                  label={secondaryLabel}
                  onClick={handleSecondaryClick}
                  disabled={isLoading || (isFirstStep && !onCancel)}
                />
              </div>
            )}
            {showSaveDraft && (
              <div className="w-full sm:flex-1">
                <Button
                  outline
                  label="Save & Proceed Later"
                  onClick={handleSaveDraft}
                  disabled={isLoading || isSavingDraft}
                  loading={isSavingDraft}
                />
              </div>
            )}
            <div className="w-full sm:flex-1">
              <Button
                label={actionLabel}
                onClick={handlePrimaryClick}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceWizard;