'use client';

import Image from 'next/image';
import clsx from 'clsx';

const countryNameToCode: Record<string, string> = {
  afghanistan: 'af',
  albania: 'al',
  algeria: 'dz',
  andorra: 'ad',
  angola: 'ao',
  antigua: 'ag',
  'antigua and barbuda': 'ag',
  argentina: 'ar',
  armenia: 'am',
  australia: 'au',
  austria: 'at',
  azerbaijan: 'az',

  bahamas: 'bs',
  bahrain: 'bh',
  bangladesh: 'bd',
  barbados: 'bb',
  belarus: 'by',
  belgium: 'be',
  belize: 'bz',
  benin: 'bj',
  bhutan: 'bt',
  bolivia: 'bo',
  'bosnia and herzegovina': 'ba',
  botswana: 'bw',
  brazil: 'br',
  brunei: 'bn',
  bulgaria: 'bg',
  'burkina faso': 'bf',
  burundi: 'bi',

  cambodia: 'kh',
  cameroon: 'cm',
  canada: 'ca',
  'cape verde': 'cv',
  'cabo verde': 'cv',
  'central african republic': 'cf',
  chad: 'td',
  chile: 'cl',
  china: 'cn',
  'costa rica': 'cr',
  croatia: 'hr',
  cuba: 'cu',
  cyprus: 'cy',
  'czech republic': 'cz',
  czechia: 'cz',

  denmark: 'dk',
  djibouti: 'dj',
  dominica: 'dm',
  'dominican republic': 'do',

  ecuador: 'ec',
  egypt: 'eg',
  'el salvador': 'sv',
  'equatorial guinea': 'gq',
  eritrea: 'er',
  estonia: 'ee',
  eswatini: 'sz',
  swaziland: 'sz',
  ethiopia: 'et',

  fiji: 'fj',
  finland: 'fi',
  france: 'fr',

  gabon: 'ga',
  gambia: 'gm',
  georgia: 'ge',
  germany: 'de',
  ghana: 'gh',
  greece: 'gr',
  grenada: 'gd',
  guatemala: 'gt',
  guinea: 'gn',
  'guinea-bissau': 'gw',
  guyana: 'gy',

  haiti: 'ht',
  honduras: 'hn',
  hungary: 'hu',

  iceland: 'is',
  india: 'in',
  indonesia: 'id',
  iran: 'ir',
  iraq: 'iq',
  ireland: 'ie',
  'republic of ireland': 'ie',
  israel: 'il',
  italy: 'it',

  jamaica: 'jm',
  japan: 'jp',
  jordan: 'jo',

  kazakhstan: 'kz',
  kenya: 'ke',
  kiribati: 'ki',
  'north korea': 'kp',
  'democratic people\'s republic of korea': 'kp',
  'south korea': 'kr',
  'republic of korea': 'kr',
  kuwait: 'kw',
  kyrgyzstan: 'kg',

  laos: 'la',
  'lao people\'s democratic republic': 'la',
  latvia: 'lv',
  lebanon: 'lb',
  lesotho: 'ls',
  liberia: 'lr',
  libya: 'ly',
  liechtenstein: 'li',
  lithuania: 'lt',
  luxembourg: 'lu',

  madagascar: 'mg',
  malawi: 'mw',
  malaysia: 'my',
  maldives: 'mv',
  mali: 'ml',
  malta: 'mt',
  'marshall islands': 'mh',
  mauritania: 'mr',
  mauritius: 'mu',
  mexico: 'mx',
  micronesia: 'fm',
  moldova: 'md',
  monaco: 'mc',
  mongolia: 'mn',
  montenegro: 'me',
  morocco: 'ma',
  mozambique: 'mz',
  myanmar: 'mm',
  burma: 'mm',

  namibia: 'na',
  nauru: 'nr',
  nepal: 'np',
  netherlands: 'nl',
  'the netherlands': 'nl',
  'new zealand': 'nz',
  nicaragua: 'ni',
  niger: 'ne',
  nigeria: 'ng',
  'north macedonia': 'mk',
  norway: 'no',

  oman: 'om',

  pakistan: 'pk',
  palau: 'pw',
  panama: 'pa',
  'papua new guinea': 'pg',
  paraguay: 'py',
  peru: 'pe',
  philippines: 'ph',
  poland: 'pl',
  portugal: 'pt',

  qatar: 'qa',

  romania: 'ro',
  russia: 'ru',
  'russian federation': 'ru',
  rwanda: 'rw',

  'saint kitts and nevis': 'kn',
  'st kitts and nevis': 'kn',
  'saint lucia': 'lc',
  'st lucia': 'lc',
  'saint vincent and the grenadines': 'vc',
  'st vincent and the grenadines': 'vc',
  samoa: 'ws',
  'san marino': 'sm',
  'sao tome and principe': 'st',
  'são tomé and príncipe': 'st',
  "saudi arabia": 'sa',
  senegal: 'sn',
  serbia: 'rs',
  seychelles: 'sc',
  'sierra leone': 'sl',
  singapore: 'sg',
  slovakia: 'sk',
  slovenia: 'si',
  'solomon islands': 'sb',
  somalia: 'so',
  'south africa': 'za',
  'south sudan': 'ss',
  spain: 'es',
  "sri lanka": 'lk',
  sudan: 'sd',
  suriname: 'sr',
  sweden: 'se',
  switzerland: 'ch',
  syria: 'sy',
  'syrian arab republic': 'sy',

  taiwan: 'tw',
  tajikistan: 'tj',
  tanzania: 'tz',
  'united republic of tanzania': 'tz',
  thailand: 'th',
  'timor-leste': 'tl',
  'east timor': 'tl',
  togo: 'tg',
  tonga: 'to',
  'trinidad and tobago': 'tt',
  tunisia: 'tn',
  turkey: 'tr',
  türkiye: 'tr',
  turkmenistan: 'tm',
  tuvalu: 'tv',

  uganda: 'ug',
  ukraine: 'ua',
  'united arab emirates': 'ae',
  uae: 'ae',
  'united kingdom': 'gb',
  'united kingdom of great britain and northern ireland': 'gb',
  uk: 'gb',
  england: 'gb',
  scotland: 'gb',
  wales: 'gb',
  'northern ireland': 'gb',
  'united states': 'us',
  'united states of america': 'us',
  usa: 'us',
  us: 'us',
  uruguay: 'uy',
  uzbekistan: 'uz',

  vanuatu: 'vu',
  venezuela: 've',
  vietnam: 'vn',

  yemen: 'ye',

  zambia: 'zm',
  zimbabwe: 'zw',
};

const getCountryCodeFromLabel = (label?: string | null): string | null => {
  if (!label) return null;
  const key = label.toLowerCase().trim();
  return countryNameToCode[key] ?? null;
};

interface CountryFlagByLabelProps {
  label?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

const CountryFlagByLabel: React.FC<CountryFlagByLabelProps> = ({
  label,
  width = 18,
  height = 12,
  className,
}) => {
  const code = getCountryCodeFromLabel(label);
  if (!code) return null;

  return (
    <Image
      src={`/flags/${code}.svg`}
      alt={label ?? 'Country flag'}
      width={width}
      height={height}
      className={clsx('rounded-sm object-cover', className)}
    />
  );
};

export default CountryFlagByLabel;