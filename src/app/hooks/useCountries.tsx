import countries from 'world-countries';

const baseCountries = countries.map((country) => ({
  value: country.cca2,
  label: country.name.common,
  flag: country.flag,
  latlng: country.latlng,
  region: country.region,
}));

// ✳️ Add popular cities manually or from your own dataset
const popularCities = [
  {
    value: 'rome',
    label: 'Italy',
    city: 'Rome',
    flag: '🇮🇹',
    latlng: [41.9028, 12.4964],
    region: 'Europe',
  },
  {
    value: 'paris',
    label: 'France',
    city: 'Paris',
    flag: '🇫🇷',
    latlng: [48.8566, 2.3522],
    region: 'Europe',
  },
  {
    value: 'new-york',
    label: 'United States',
    city: 'New York',
    flag: '🇺🇸',
    latlng: [40.7128, -74.006],
    region: 'North America',
  },
  {
    value: 'tokyo',
    label: 'Japan',
    city: 'Tokyo',
    flag: '🇯🇵',
    latlng: [35.6762, 139.6503],
    region: 'Asia',
  },
];

const formattedCountries = [...baseCountries, ...popularCities];

const useCountries = () => {
  const getAll = () => formattedCountries;

  const getByValue = (value: string) => {
    return formattedCountries.find((item) => item.value === value);
  };

  return {
    getAll,
    getByValue,
  };
};

export default useCountries;
