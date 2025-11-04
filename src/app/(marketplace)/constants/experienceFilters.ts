export type ExperienceFilterOption = {
  label: string;
  value: string;
};

export const GROUP_STYLE_OPTIONS: ExperienceFilterOption[] = [
  { label: 'Private', value: 'private' },
  { label: 'Group', value: 'group' },
  { label: 'Solo-friendly', value: 'solo-friendly' },
  { label: 'Couples', value: 'couples' },
  { label: 'Families', value: 'families' },
  { label: 'Corporate / Team-building', value: 'corporate-team-building' },
];

export const DURATION_OPTIONS: ExperienceFilterOption[] = [
  { label: 'Short (1–2 hours)', value: 'short' },
  { label: 'Half-day', value: 'half-day' },
  { label: 'Full-day', value: 'full-day' },
  { label: 'Multi-day / Retreats', value: 'multi-day' },
];

export const ENVIRONMENT_OPTIONS: ExperienceFilterOption[] = [
  { label: 'City', value: 'city' },
  { label: 'Mountains', value: 'mountains' },
  { label: 'Desert', value: 'desert' },
  { label: 'Sea & Coast', value: 'sea-coast' },
  { label: 'Countryside', value: 'countryside' },
  { label: 'Arctic / Polar', value: 'arctic-polar' },
  { label: 'Tropical', value: 'tropical' },
];

export const ACTIVITY_FORM_OPTIONS: ExperienceFilterOption[] = [
  { label: 'Walking', value: 'walking' },
  { label: 'Driving / Jeep', value: 'driving-jeep' },
  { label: 'Boat / Yacht', value: 'boat-yacht' },
  { label: 'Bike / E-bike', value: 'bike-e-bike' },
  { label: 'Helicopter / Small Aircraft', value: 'helicopter-aircraft' },
  { label: 'Train', value: 'train' },
  { label: 'Horse / Camel / Animal-assisted', value: 'animal-assisted' },
  { label: 'On the water / underwater', value: 'on-or-under-water' },
  { label: 'At home / virtual', value: 'at-home-virtual' },
];

export const SEO_KEYWORD_OPTIONS: ExperienceFilterOption[] = [
  { label: 'Street food', value: 'street-food' },
  { label: 'Wine tasting', value: 'wine-tasting' },
  { label: 'Cooking class', value: 'cooking-class' },
  { label: 'Photography walk', value: 'photography-walk' },
  { label: 'Surf lessons', value: 'surf-lessons' },
  { label: 'Sailing trip', value: 'sailing-trip' },
  { label: 'Safari', value: 'safari' },
  { label: 'Hiking / trekking', value: 'hiking-trekking' },
  { label: 'Museum tours', value: 'museum-tours' },
  { label: 'Historical storytelling', value: 'historical-storytelling' },
  { label: 'Local crafts workshop', value: 'local-crafts-workshop' },
  { label: 'Yoga & meditation', value: 'yoga-meditation' },
  { label: 'Spa & thermal springs', value: 'spa-thermal-springs' },
  { label: 'Night tours', value: 'night-tours' },
  { label: 'Scuba / snorkeling', value: 'scuba-snorkeling' },
  { label: 'Extreme thrill (paragliding, zipline, atv, etc.)', value: 'extreme-thrill' },
  { label: 'Fishing tours', value: 'fishing-tours' },
  { label: 'Music events', value: 'music-events' },
  { label: 'Theater & performance', value: 'theater-performance' },
  { label: 'Rooftop experiences', value: 'rooftop-experiences' },
  { label: 'Pub crawl', value: 'pub-crawl' },
  { label: 'Wildlife observation', value: 'wildlife-observation' },
  { label: 'Snow sports & alpine', value: 'snow-sports-alpine' },
  { label: 'Desert caravan / camp', value: 'desert-caravan' },
  { label: 'Village immersion', value: 'village-immersion' },
  { label: 'Nomadic lifestyle experiences', value: 'nomadic-lifestyle' },
];
