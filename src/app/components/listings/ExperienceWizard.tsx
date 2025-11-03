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
import useCountries from '@/app/hooks/useCountries';
import { categories } from '../navbar/Categories';
import CountrySearchSelect, { CountrySearchSelectHandle } from '../inputs/CountrySearchSelect';
import MeetingPointAutocomplete from '../inputs/MeetingPointAutocomplete';
import { SafeListing, SafeUser } from '@/app/types';
import {
  ACTIVITY_FORM_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GROUP_STYLE_OPTIONS,
  SEO_KEYWORD_OPTIONS,
} from '@/app/constants/experienceFilters';
import { FiClock, FiDollarSign, FiFileText, FiGlobe, FiImage, FiList, FiMapPin, FiSliders, FiUsers } from 'react-icons/fi';


const hourOptions = [
  '1', '1.5', '2', '2.5', '3', '4', '5', '6', '7', '8', '9',
  '10', '11', '12', '13', '14', '15', '16'
].map((h) => ({ label: `${h} hours`, value: h }));

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
  const allLocations = getAll();
  const flatLocationTypeOptions = useMemo(
    () => locationTypeOptions.flatMap((group) => group.options),
    [],
  );

  const searchInputRef = useRef<CountrySearchSelectHandle | null>(null);
  const [locationError, setLocationError] = useState(false);

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
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
  const pricingType = watch('pricingType');
  const customPricing = watch('customPricing');
  const groupPrice = watch('groupPrice');
  const groupSize = watch('groupSize');
  const price = watch('price');

  const {
    fields: customPricingFields,
    append: appendPricingTier,
    remove: removePricingTier,
  } = useFieldArray({
    control,
    name: 'customPricing',
  });

  const editingListing = initialListing;
  const isEditing = Boolean(editingListing);

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

  useEffect(() => {
    if (!editingListing) {
      return;
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
        : defaultFormValues.customPricing;

    reset(
      {
        ...defaultFormValues,
        category: Array.isArray(editingListing.category)
          ? editingListing.category
          : [],
        location: resolvedLocation,
        guestCount: editingListing.guestCount ?? defaultFormValues.guestCount,
        imageSrc: Array.isArray(editingListing.imageSrc)
          ? editingListing.imageSrc
          : [],
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
        pricingType: pricingMode,
        groupPrice: editingListing.groupPrice ?? null,
        groupSize: editingListing.groupSize ?? null,
        customPricing: normalizedCustomPricing,
      },
      { keepDefaultValues: true },
    );

    setLocationQuery(
      resolvedLocation
        ? `${resolvedLocation.city ? `${resolvedLocation.city}, ` : ''}${resolvedLocation.label}`
        : '',
    );
    setLocationError(false);
    setStep(STEPS.CATEGORY);
  }, [
    editingListing,
    reset,
    defaultFormValues,
    setLocationError,
    setLocationQuery,
    allLocations,
    getByValue,
    flatLocationTypeOptions,
  ]);

  useEffect(() => {
    if (step === STEPS.LOCATION) {
      const id = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [step]);


  const onBack = () => setStep((prev) => prev - 1);
  const onNext = () => setStep((prev) => prev + 1);

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

    if (step === STEPS.IMAGES) {
      if (!imageSrc || !Array.isArray(imageSrc) || imageSrc.length === 0) {
        toast.error('Please upload at least one image or video.');
        return;
      }
      return onNext();
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
  const isLastStep = step === STEPS.PRICE;

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

  const handlePrimaryClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLastStep) {
      void handleSubmit(onSubmit)();
      return;
    }

    onNext();
  };

  let bodyContent: JSX.Element = <div />;

  if (step === STEPS.CATEGORY) {
    bodyContent = (
      <div className="flex flex-col gap-6">
        <Heading
          title="What type of experience are you offering?"
          subtitle="Select one category to continue"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[55vh] md:max-h-[60vh] overflow-y-auto pr-1">
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
        {/* <Heading title="Where is your event located?" subtitle="Choose a location" /> */}

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
          <div className="h-64 md:h-80 w-full overflow-hidden rounded-xl border border-neutral-200">
            <SearchMap
              key={`map-${editingListing?.id ?? 'new'}-${location?.value ?? 'default'}`}
              city={location?.city ?? 'Rome'}
              country={location?.label ?? 'Italy'}
              center={(location?.latlng as [number, number]) ?? ([41.9028, 12.4964] as [number, number])}
              // className="h-full w-full"
            />
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
      <div className="flex flex-col gap-8 min-h-[40vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium">Group style</label>
          <Select
            options={groupStyleOptions}
            value={groupStyles}
            onChange={(value: any) => setCustomValue('groupStyles', value)}
            placeholder="Choose one style"
            menuPlacement="auto"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
          <p className="text-xs text-neutral-500">Select the group dynamic that best matches your experience.</p>
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
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                key: PRICING_TYPES.FIXED,
                title: 'Fixed price',
                description: 'Same price for every guest',
              },
              {
                key: PRICING_TYPES.GROUP,
                title: 'Group pricing',
                description: 'Charge one amount for a private group',
              },
              {
                key: PRICING_TYPES.CUSTOM,
                title: 'Custom ranges',
                description: 'Set different prices for guest ranges',
              },
            ].map((option) => {
              const isActive = pricingType === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setCustomValue('pricingType', option.key)}
                  aria-pressed={isActive}
                  className={clsx(
                    'rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-black/20',
                    isActive
                      ? 'border-black bg-white shadow-lg shadow-black/10'
                      : 'border-neutral-200 bg-white/80 hover:border-black/30',
                  )}
                >
                  <h3 className="text-base font-semibold text-neutral-900">{option.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {pricingType === PRICING_TYPES.FIXED && (
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
        )}

        {pricingType === PRICING_TYPES.GROUP && (
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        )}

        {pricingType === PRICING_TYPES.CUSTOM && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Create price tiers for different group sizes. Guests will see the range that applies to
              their party.
            </p>

            <div className="flex flex-col gap-4">
              {customPricingFields.map((field, index) => (
                <div
                  key={field.id}
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
                </div>
              ))}
            </div>

            <button
              type="button"
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
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 lg:flex-row">
        <aside className="hidden w-full max-w-xs shrink-0 lg:block">
          <nav className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
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
                    'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition',
                    status === 'current' && 'border-black/80 bg-black text-white shadow-md',
                    status === 'complete' && 'border-emerald-500/60 bg-emerald-50 text-emerald-700 hover:border-emerald-500',
                    status === 'upcoming' && 'border-transparent bg-neutral-100 text-neutral-400 hover:border-neutral-200'
                  )}
                  disabled={status === 'upcoming'}
                >
                  <span
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-full border text-lg',
                      status === 'current' && 'border-white bg-white/20 text-white',
                      status === 'complete' && 'border-emerald-500 bg-white text-emerald-600',
                      status === 'upcoming' && 'border-neutral-200 bg-white text-neutral-400'
                    )}
                  >
                    <Icon />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold tracking-wide uppercase">Step {index + 1}</span>
                    <span className="text-base font-semibold">{item.title}</span>
                    <span className="text-xs text-neutral-500">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="lg:hidden">
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
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
                      'flex min-w-[170px] flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left transition',
                      status === 'current' && 'border-black bg-black text-white shadow-md',
                      status === 'complete' && 'border-emerald-500/60 bg-emerald-50 text-emerald-700',
                      status === 'upcoming' && 'border-neutral-200 bg-white text-neutral-400'
                    )}
                    disabled={status === 'upcoming'}
                  >
                    <span
                      className={clsx(
                        'flex h-9 w-9 items-center justify-center rounded-full border text-base',
                        status === 'current' && 'border-white bg-white/20 text-white',
                        status === 'complete' && 'border-emerald-500 bg-white text-emerald-600',
                        status === 'upcoming' && 'border-neutral-200 bg-neutral-100 text-neutral-400'
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

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            {bodyContent}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {secondaryLabel && (
                <div className="sm:w-auto sm:min-w-[160px]">
                  <Button
                    outline
                    label={secondaryLabel}
                    onClick={handleSecondaryClick}
                    disabled={isLoading || (isFirstStep && !onCancel)}
                  />
                </div>
              )}
              <div className="sm:w-auto sm:min-w-[160px]">
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
    </div>
  );
};

export default ExperienceWizard;