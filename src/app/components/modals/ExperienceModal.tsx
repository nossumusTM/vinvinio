'use client';

import axios from 'axios';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Input from '../inputs/Input';
import Heading from '../Heading';
import ImageUpload from '../inputs/ImageUpload';
import CountrySelect from '../inputs/CountrySelect';
import Counter from '../inputs/Counter';
import CategoryInput from '../inputs/CategoryInput';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import useCountries from '@/app/hooks/useCountries';
import { categories } from '../navbar/Categories';
import CountrySearchSelect, { CountrySearchSelectHandle } from '../inputs/CountrySearchSelect';
import { SafeUser } from '@/app/types';
import {
  ACTIVITY_FORM_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GROUP_STYLE_OPTIONS,
  SEO_KEYWORD_OPTIONS,
} from '@/app/constants/experienceFilters';

import useExperienceModal from '@/app/hooks/useExperienceModal';

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

const ExperienceModal = ({ currentUser }: { currentUser: SafeUser | null }) => {
  const experienceModal = useExperienceModal();
  const router = useRouter();

  const [step, setStep] = useState(STEPS.CATEGORY);
  const [isLoading, setIsLoading] = useState(false);

  const [locationQuery, setLocationQuery] = useState('');
  const { getAll } = useCountries();
  const allLocations = getAll();

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


  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {
      category: [],
      location: null,
      guestCount: 1,
      imageSrc: [],
      title: '',
      description: '',
      price: 100,
      experienceHour: '',
      hostDescription: '',
      meetingPoint: '',
      languages: [],
      locationType: [],
      locationDescription: '',
      groupStyles: [],
      durationCategory: null,
      environments: [],
      activityForms: [],
      seoKeywords: [],
    }
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

  // const Map = useMemo(
  //   () => dynamic(() => import('../Map'), { ssr: false }),
  //   [location]
  // );
  const Map = useMemo(
    () => dynamic(() => import('../Map'), { ssr: false }),
    []
  );  

  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
  if (step === STEPS.LOCATION && experienceModal.isOpen) {
    // give the modal time to render then trigger a resize
    const id = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(id);
  }
}, [step, experienceModal.isOpen]);


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
      if (!data.experienceHour || !data.meetingPoint) {
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
      const selectedGroupStyles = Array.isArray(data.groupStyles) ? data.groupStyles : [];
      const selectedEnvironments = Array.isArray(data.environments) ? data.environments : [];
      const selectedActivityForms = Array.isArray(data.activityForms) ? data.activityForms : [];
      const selectedKeywords = Array.isArray(data.seoKeywords) ? data.seoKeywords : [];
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

      if (selectedKeywords.length < 3) {
        toast.error('Add at least three SEO keywords or custom tags.');
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
      setIsLoading(true);

      const formatMulti = (value: any) =>
        Array.isArray(value)
          ? value
              .map((item: any) => (typeof item === 'string' ? item : item?.value || item?.label))
              .filter((item: string) => typeof item === 'string' && item.trim().length > 0)
          : [];

      const durationValue =
        typeof data.durationCategory === 'string'
          ? data.durationCategory
          : data.durationCategory?.value ?? null;

      const submissionData = {
        ...data,
        groupStyles: formatMulti(data.groupStyles),
        durationCategory: durationValue,
        environments: formatMulti(data.environments),
        activityForms: formatMulti(data.activityForms),
        seoKeywords: formatMulti(data.seoKeywords),
        status: 'pending',
      };

      axios.post('/api/listings', submissionData)
        .then(() => {
          toast.success('Listing submitted for review', {
            iconTheme: {
              primary: '#2200ffff',
              secondary: '#fff',
            },
          });          
          reset();
          experienceModal.onClose();
          router.refresh();
          setStep(STEPS.CATEGORY);
        })
        .catch(() => toast.error('Something went wrong.'))
        .finally(() => setIsLoading(false));
    }
  };  
  
  const actionLabel = useMemo(() => (
    step === STEPS.PRICE ? 'Create' : 'Next'
  ), [step]);

  const secondaryActionLabel = useMemo(() => (
    step === STEPS.CATEGORY ? undefined : 'Back'
  ), [step]);

  let bodyContent: JSX.Element = <div />;

  if (step === STEPS.CATEGORY) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="What type of experience are you offering?"
          subtitle="Select one category to continue"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[30vh] md:max-h-[50vh] overflow-y-auto">
          {categories.map((item) => {
            const isSelected = Array.isArray(category) && category.includes(item.label);
  
            return (
              <div key={item.label} className="col-span-1">
                <CategoryInput
                  onClick={() => {
                    let updated = [item.label];
                    setCustomValue('category', updated);
                    setTimeout(() => setStep(STEPS.LOCATION), 100); // slight delay for UX
                  }}
                  selected={isSelected}
                  label={item.label}
                  icon={item.icon}
                />
              </div>
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
              key={`map-${experienceModal.isOpen}-${location?.value ?? 'default'}`}
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
        <Input
          id="meetingPoint"
          label="Provide a meeting-point"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
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
            isMulti
            closeMenuOnSelect={false}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
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
          <label className="text-md font-medium">SEO keywords (pick at least three)</label>
          <CreatableSelect
            isMulti
            options={seoKeywordOptions}
            value={seoKeywords}
            onChange={(value: any) => setCustomValue('seoKeywords', value)}
            placeholder="Select or write your own tags"
            formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
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
        <Heading title="Pricing" subtitle="Set your price per person" />
        <Input
          id="price"
          label="Price / Person"
          type="number"
          formatPrice
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    );
  }

  return (
    <Modal
      disabled={isLoading}
      isOpen={experienceModal.isOpen}
      title="Add an Experience"
      actionLabel={actionLabel}
      onSubmit={handleSubmit(onSubmit)}
      secondaryActionLabel={secondaryActionLabel}
      secondaryAction={step === STEPS.CATEGORY ? undefined : onBack}
      onClose={experienceModal.onClose}
      body={bodyContent}
      className="max-h-[90vh] overflow-y-auto"
    />
  );
};

export default ExperienceModal;