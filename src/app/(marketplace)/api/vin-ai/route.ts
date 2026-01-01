// import { NextResponse } from 'next/server';

// interface RequestMessage {
//   role: 'assistant' | 'user';
//   content: string;
// }

// export async function POST(request: Request) {
//   const { messages } = (await request.json()) as { messages?: RequestMessage[] };
//   const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
//   const openaiProject = process.env.OPENAI_PROJECT_ID?.trim();
//   const openaiOrganization = process.env.OPENAI_ORG_ID?.trim();

//   if (!messages || !Array.isArray(messages) || messages.length === 0) {
//     return NextResponse.json({ reply: 'Tell me what you are looking for and I will curate listings for you.' });
//   }

//   const normalizedMessages = messages.map((m) => ({ role: m.role, content: m.content })).slice(-12);

//   if (!openaiApiKey) {
//     const lastUserMessage = [...normalizedMessages].reverse().find((m) => m.role === 'user');
//     return NextResponse.json({
//       reply: `Here is a tailored shortlist for "${lastUserMessage?.content ?? 'your trip'}". Pick a city, dates, and guest count so I can surface the right listings.`,
//     });
//   }

//   try {
//     const headers: Record<string, string> = {
//       Authorization: `Bearer ${openaiApiKey}`,
//       'Content-Type': 'application/json',
//     };

//     if (openaiProject) {
//       headers['OpenAI-Project'] = openaiProject;
//     }

//     if (openaiOrganization) {
//       headers['OpenAI-Organization'] = openaiOrganization;
//     }

//     const completion = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           {
//             role: 'system',
//             content:
//               'You are AI Force, a travel concierge for Vuola. Answer concisely with bullet points and surface relevant listing hints: where, when, and who should travel.',
//           },
//           ...normalizedMessages,
//         ],
//         temperature: 0.4,
//         max_tokens: 280,
//       }),
//     });

//     if (!completion.ok) {
//       const errorBody = await completion.text();
//       let errorMessage = errorBody;
//       let reply = 'I could not reach the AI model. Please try again in a moment.';

//       try {
//         const parsed = JSON.parse(errorBody) as { error?: { message?: string; code?: string } };
//         if (parsed?.error?.message) {
//           errorMessage = parsed.error.message;
//         }

//         if (completion.status === 429 || parsed?.error?.code === 'insufficient_quota') {
//           reply = 'AI Force is at capacity right now. Please try again soon.';
//         }
//       } catch (parseError) {
//         if (completion.status === 429) {
//           reply = 'AI Force is at capacity right now. Please try again soon.';
//         }
//       }

//       console.error('AI Force request failed', {
//         status: completion.status,
//         message: errorMessage,
//       });
//       return NextResponse.json({ reply }, { status: 200 });
//     }

//     const data = await completion.json();
//     const reply = data?.choices?.[0]?.message?.content as string | undefined;
//     return NextResponse.json({ reply: reply ?? 'Ask me anything about your next stay and I will tailor the results.' });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : 'Unknown error';
//     console.error('AI Force request failed', message);
//     return NextResponse.json({ reply: 'I could not reach the AI model. Please try again in a moment.' }, { status: 200 });
//   }
// }

import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import {
  ACTIVITY_FORM_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GROUP_STYLE_OPTIONS,
} from '@/app/(marketplace)/constants/experienceFilters';

import countries from 'world-countries';

interface RequestMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface MemoryPayload {
  location?: string | null;
  category?: string | null;
  dateRange?: { startDate?: string; endDate?: string } | null;
  guestCount?: number | null;
  keywords?: string[];
}

type DateRange = { startDate: Date; endDate: Date };

const CATEGORY_MATCHERS = [
  { label: 'Adventure & Outdoor', keywords: ['adventure', 'outdoor', 'hike', 'hiking', 'trek', 'camp'] },
  { label: 'Nature & Wildlife', keywords: ['nature', 'wildlife', 'safari', 'forest', 'eco'] },
  { label: 'Water Activities', keywords: ['water', 'boat', 'sailing', 'surf', 'snorkel', 'dive', 'beach'] },
  { label: 'Food, Drinks & Culinary', keywords: ['food', 'drink', 'wine', 'tasting', 'culinary', 'cook', 'chef'] },
  { label: 'Culture & History', keywords: ['culture', 'history', 'museum', 'heritage', 'landmark'] },
  { label: 'Art, Design & Photography', keywords: ['art', 'design', 'photo', 'photography', 'gallery'] },
  { label: 'Music, Nightlife & Social', keywords: ['music', 'nightlife', 'party', 'social', 'dj'] },
  { label: 'Sports, Fitness & Well-Being', keywords: ['fitness', 'sport', 'yoga', 'wellness', 'spa'] },
  { label: 'Workshops & Skill-Learning', keywords: ['workshop', 'class', 'lesson', 'learning', 'craft'] },
  { label: 'Tours & Sightseeing', keywords: ['tour', 'sightseeing', 'guide', 'walk'] },
  { label: 'Luxury, VIP & Exclusive Access', keywords: ['luxury', 'vip', 'exclusive', 'premium'] },
  { label: 'Romantic & Special Occasions', keywords: ['romantic', 'honeymoon', 'anniversary', 'proposal'] },
];

const COUNTRY_MATCHERS = [
  ...countries.map((country) => ({
    name: country.name.common,
    synonyms: [country.name.common, country.name.official, ...(country.altSpellings ?? [])].filter(Boolean),
  })),
  { name: 'United States', synonyms: ['usa', 'u.s.a', 'u.s.', 'us', 'america', 'united states'] },
  { name: 'United Kingdom', synonyms: ['uk', 'u.k.', 'great britain', 'britain', 'england'] },
  { name: 'United Arab Emirates', synonyms: ['uae', 'u.a.e', 'emirates'] },
].map((entry) => ({
  name: entry.name,
  synonyms: Array.from(new Set(entry.synonyms.map((value) => value.toLowerCase()))),
}));


const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'for',
  'with',
  'without',
  'to',
  'from',
  'in',
  'on',
  'at',
  'of',
  'by',
  'is',
  'are',
  'be',
  'am',
  'was',
  'were',
  'it',
  'this',
  'that',
  'these',
  'those',
  'i',
  'we',
  'you',
  'my',
  'our',
  'your',
  'me',
  'us',
  'show',
  'find',
  'need',
  'looking',
  'want',
  'like',
  'please',
  'can',
  'could',
  'would',
  'book',
  'booking',
  'trip',
  'travel',
  'stay',
  'experience',
  'service',
  'listing',
  'listings',
  'available',
  'availability',
  'date',
  'dates',
  'time',
]);

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  janury: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const numberFromWord = (value?: string) =>
  value ? NUMBER_WORDS[value.toLowerCase()] ?? Number(value) : undefined;

const normalizeYear = (value?: string) => {
  if (!value) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric < 100 ? 2000 + numeric : numeric;
};

const extractKeywords = (text: string) => {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];
  const parts = normalized.split(' ').filter(Boolean);
  const keywords = parts.filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return Array.from(new Set(keywords)).slice(0, 12);
};

const parseDateRange = (text: string): DateRange | null => {
  const matches = text.match(/\b\d{4}-\d{2}-\d{2}\b/g);
  if (!matches || matches.length < 2) return null;
  const [startRaw, endRaw] = matches;
  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  return { startDate, endDate };
};

const parseNamedDateRange = (text: string): DateRange | null => {
  const normalized = text
    .toLowerCase()
    .replace(/(\d)(st|nd|rd|th)\b/g, '$1')
    .replace(/[,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  const monthRegex =
    '(jan(?:uary)?|janury|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const dayRegex = '(\\d{1,2})';
  const yearRegex = '(\\d{2,4})?';
  const divider = '(?:to|through|until|\\-|–|—)';

  const patterns = [
    new RegExp(`\\b${monthRegex}\\s+${dayRegex}\\s+${yearRegex}\\s*${divider}\\s*${monthRegex}\\s+${dayRegex}\\s+${yearRegex}\\b`, 'i'),
    new RegExp(`\\b${dayRegex}\\s+${monthRegex}\\s+${yearRegex}\\s*${divider}\\s*${dayRegex}\\s+${monthRegex}\\s+${yearRegex}\\b`, 'i'),
    new RegExp(`\\b${monthRegex}\\s+${dayRegex}\\s*${divider}\\s*${dayRegex}\\s+${yearRegex}\\b`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    if (pattern === patterns[0]) {
      const [, startMonth, startDay, startYear, endMonth, endDay, endYear] = match;
      const startYearValue = normalizeYear(startYear) ?? new Date().getFullYear();
      const endYearValue =
        normalizeYear(endYear) ?? normalizeYear(startYear) ?? new Date().getFullYear();
      const start = new Date(startYearValue, MONTHS[startMonth], Number(startDay));
      const end = new Date(endYearValue, MONTHS[endMonth], Number(endDay));
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        return { startDate: start, endDate: end };
      }
    }

    if (pattern === patterns[1]) {
      const [, startDay, startMonth, startYear, endDay, endMonth, endYear] = match;
      const startYearValue = normalizeYear(startYear) ?? new Date().getFullYear();
      const endYearValue =
        normalizeYear(endYear) ?? normalizeYear(startYear) ?? new Date().getFullYear();
      const start = new Date(startYearValue, MONTHS[startMonth], Number(startDay));
      const end = new Date(endYearValue, MONTHS[endMonth], Number(endDay));
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        return { startDate: start, endDate: end };
      }
    }

    if (pattern === patterns[2]) {
      const [, month, startDay, endDay, year] = match;
      const yearValue = normalizeYear(year) ?? new Date().getFullYear();
      const start = new Date(yearValue, MONTHS[month], Number(startDay));
      const end = new Date(yearValue, MONTHS[month], Number(endDay));
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        return { startDate: start, endDate: end };
      }
    }
  }

  const loosePattern = new RegExp(`\\b${monthRegex}\\s+${dayRegex}(?:\\s+(\\d{2,4}))?\\b`, 'gi');
  const matches = Array.from(normalized.matchAll(loosePattern));
  if (matches.length >= 2) {
    const [first, second] = matches;
    const startMonth = first[1];
    const startDay = first[2];
    const startYear = normalizeYear(first[3]) ?? new Date().getFullYear();
    const endMonth = second[1];
    const endDay = second[2];
    const endYear = normalizeYear(second[3]) ?? startYear;
    const start = new Date(startYear, MONTHS[startMonth], Number(startDay));
    const end = new Date(endYear, MONTHS[endMonth], Number(endDay));
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return { startDate: start, endDate: end };
    }
  }

  const looseDayPattern = new RegExp(`\\b${dayRegex}\\s+${monthRegex}(?:\\s+(\\d{2,4}))?\\b`, 'gi');
  const dayMatches = Array.from(normalized.matchAll(looseDayPattern));
  if (dayMatches.length >= 2) {
    const [first, second] = dayMatches;
    const startDay = first[1];
    const startMonth = first[2];
    const startYear = normalizeYear(first[3]) ?? new Date().getFullYear();
    const endDay = second[1];
    const endMonth = second[2];
    const endYear = normalizeYear(second[3]) ?? startYear;
    const start = new Date(startYear, MONTHS[startMonth], Number(startDay));
    const end = new Date(endYear, MONTHS[endMonth], Number(endDay));
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return { startDate: start, endDate: end };
    }
  }

  return null;
};

const parseNumericDate = (text: string): DateRange | null => {
  const match = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (!match) return null;
  const [, first, second, yearRaw] = match;
  const firstValue = Number(first);
  const secondValue = Number(second);
  const yearValue = normalizeYear(yearRaw);
  if (!yearValue || !Number.isFinite(firstValue) || !Number.isFinite(secondValue)) return null;
  const [month, day] =
    firstValue > 12 && secondValue <= 12
      ? [secondValue, firstValue]
      : secondValue > 12 && firstValue <= 12
        ? [firstValue, secondValue]
        : [firstValue, secondValue];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(yearValue, month - 1, day);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month - 1) return null;
  return { startDate: date, endDate: date };
};

const parseSingleDate = (text: string): DateRange | null => {
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const date = new Date(isoMatch[1]);
    if (!Number.isNaN(date.getTime())) {
      return { startDate: date, endDate: date };
    }
  }

  const numericMatch = parseNumericDate(text);
  if (numericMatch) return numericMatch;

  const normalized = text
    .toLowerCase()
    .replace(/(\d)(st|nd|rd|th)\b/g, '$1')
    .replace(/[,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  const monthRegex =
    '(jan(?:uary)?|janury|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const dayRegex = '(\\d{1,2})';

  const match = normalized.match(new RegExp(`\\b${monthRegex}\\s+${dayRegex}(?:\\s+(\\d{2,4}))?\\b`, 'i'));
  if (!match) return null;

  const [, month, day, year] = match;
  const yearValue = normalizeYear(year) ?? new Date().getFullYear();
  const date = new Date(yearValue, MONTHS[month], Number(day));
  if (Number.isNaN(date.getTime())) return null;
  return { startDate: date, endDate: date };
};

const matchCountryInText = (text: string) => {
  const lowercase = text.toLowerCase();
  let bestMatch: string | null = null;
  for (const entry of COUNTRY_MATCHERS) {
    const hit = entry.synonyms.find((synonym) => {

      if (STOP_WORDS.has(synonym)) {
        return false;
      }

      if (synonym.length <= 3) {
        return new RegExp(`\\b${synonym.replace('.', '\\.')}\\b`, 'i').test(lowercase);
      }
      return lowercase.includes(synonym);
    });
    if (hit) {
      if (!bestMatch || entry.name.length > bestMatch.length) {
        bestMatch = entry.name;
      }
    }
  }

  return bestMatch;
};

const extractCityCountry = (text: string, country: string) => {
  const escapedCountry = country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`\\b([a-zA-Z][a-zA-Z\\s-]{2,40})\\s*,?\\s+${escapedCountry}\\b`, 'i'));
  if (!match) return null;
  const city = match[1].trim();
  if (!city) return null;
  const lower = city.toLowerCase();
  if (MONTHS[lower] !== undefined) return null;
  return city;
};

const extractLocation = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const match = normalized.match(
    /\b(?:in|at|near|around|from|to|country|region|city)\s+([a-zA-Z][a-zA-Z\s,-]{2,60})/i,
  );
  if (match) {
    const location = match[1]
      .replace(/\b(for|with|on|in|at|around)\b.*$/i, '')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
    if (location) {
      if (!/[a-zA-Z]/.test(location)) return null;
      const lower = location.toLowerCase();
      if (MONTHS[lower] !== undefined) return null;
      return location;
    }
  }

  const bestMatch = matchCountryInText(normalized);

  if (bestMatch) {
    const city = extractCityCountry(normalized, bestMatch);
    if (city) return `${city}, ${bestMatch}`;
    return bestMatch;
  }

  const regionMatch = normalized.match(/\b(europe|asia|africa|oceania|north america|south america|middle east)\b/i);
  if (regionMatch) return regionMatch[1];

  return null;
};

const extractGuestCount = (text: string) => {

  const normalized = text.toLowerCase();

  const directMatch = text.match(/\b(?:guest count|guest|guests|people|party size|group size)\s*[:\-]?\s*(\d{1,2})\b/i);
  if (directMatch) {
    const value = Number(directMatch[1]);
    return Number.isFinite(value) ? value : null;
  }

  if (/\b(solo|alone|by myself|just me|only me)\b/.test(normalized)) return 1;
  if (/\b(couple|my partner|my husband|my wife|my boyfriend|my girlfriend)\b/.test(normalized)) return 2;
  if (/\b(me and (?:my )?(friend|partner|husband|wife|girlfriend|boyfriend))\b/.test(normalized)) return 2;
  if (/\bwith my (friend|partner|husband|wife|girlfriend|boyfriend)\b/.test(normalized)) return 2;

  const match =
    text.match(/\b(\d{1,2})\s*(guests?|people|persons|travellers|travelers|adults|friends)\b/i) ||
    text.match(/\bfor\s+(\d{1,2})\b(?!\s*(nights?|days?|hours?))/i);
  if (match) {
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  const groupMatch = normalized.match(/\b(group|party|family) of (\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/);
  if (groupMatch) {
    const value = numberFromWord(groupMatch[2]);
    return value && Number.isFinite(value) ? value : null;
  }

  const weMatch = normalized.match(/\b(we are|we're|we)\s+(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/);
  if (weMatch) {
    const value = numberFromWord(weMatch[2]);
    return value && Number.isFinite(value) ? value : null;
  }

  const meAndMatch = normalized.match(/\bme and (\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(friends|people|others)\b/);
  if (meAndMatch) {
    const value = numberFromWord(meAndMatch[1]);
    return value && Number.isFinite(value) ? value + 1 : null;
  }

  const withFriendsMatch = normalized.match(/\bwith (\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(friends|people|others)\b/);
  if (withFriendsMatch) {
    const value = numberFromWord(withFriendsMatch[1]);
    return value && Number.isFinite(value) ? value + 1 : null;
  }

  return null;
};

const parseStandaloneGuestCount = (text: string) => {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;
  if (/^\d{1,2}$/.test(trimmed)) return Number(trimmed);
  if (/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)$/.test(trimmed)) {
    return numberFromWord(trimmed) ?? null;
  }
  return null;
};

const isGuestCountPrompt = (text: string) =>
  /\b(guest|guests|people|persons|travellers|travelers|adults|party|group|family|how many|how much)\b/i.test(text);

const extractCategory = (text: string) => {
  const lower = text.toLowerCase();
  const match = CATEGORY_MATCHERS.find((category) =>
    category.keywords.some((keyword) => lower.includes(keyword)),
  );
  return match?.label ?? null;
};

const buildFollowUpReply = (params: {
  greeting?: string;
  missing: string[];
  categoryHint?: string | null;
  knownFields?: string[];
}) => {
  const focusLine = params.categoryHint
    ? `I can tailor it within "${params.categoryHint}" or something else you prefer.`
    : `Share the vibe or activity you want.`;

  const prompts: Record<string, string> = {
    location: 'Your country/region or city (or tap “Use my location”).',
    category: `What kind of experience are you looking for? ${focusLine}`,
    dates: 'Your dates (e.g., Jan 7 to Jan 10 2026) so I can check availability.',
    guests: 'How many people are traveling (solo, with a friend, family of four, etc.). You can reply with just a number.',
  };

  const knownLine =
    params.knownFields && params.knownFields.length > 0
      ? `I’ve saved: ${params.knownFields.join(', ')}.`
      : null;
  const missingLines = params.missing.map((key) => `• ${prompts[key]}`).join('\n');

  return [
    params.greeting,
    knownLine,
    '## To curate the best matches, I just need a few details:',
    missingLines,
    '',
    'Once I have them, I will check availability and rank listings by their reviews.',
  ]
    .filter(Boolean)
    .join('\n');
};

const truncate = (value: string, max = 120) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
};

const buildKeywordWhere = (keywords: string[]) => {
  if (keywords.length === 0) return {};
  const textMatches = keywords.flatMap((word) => [
    { title: { contains: word, mode: 'insensitive' as const } },
    { description: { contains: word, mode: 'insensitive' as const } },
    { locationValue: { contains: word, mode: 'insensitive' as const } },
  ]);

  return {
    OR: [
      { seoKeywords: { hasSome: keywords } },
      { category: { hasSome: keywords } },
      { primaryCategory: { in: keywords } },
      { groupStyles: { hasSome: keywords } },
      { environments: { hasSome: keywords } },
      { activityForms: { hasSome: keywords } },
      { locationType: { hasSome: keywords } },
      { durationCategory: { in: keywords } },
      ...textMatches,
    ],
  };
};

const buildCategoryWhere = (category: string | null) => {
  if (!category) return {};
  return {
    OR: [
      { primaryCategory: { equals: category, mode: 'insensitive' as const } },
      { category: { has: category } },
    ],
  };
};

const buildLocationWhere = (location: string | null) => {
  if (!location) return {};
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    return {
      AND: parts.map((part) => ({
        OR: [
          { locationValue: { contains: part, mode: 'insensitive' as const } },
          { locationDescription: { contains: part, mode: 'insensitive' as const } },
          { meetingPoint: { contains: part, mode: 'insensitive' as const } },
        ],
      })),
    };
  }
  return {
    OR: [
      { locationValue: { contains: location, mode: 'insensitive' as const } },
      { locationDescription: { contains: location, mode: 'insensitive' as const } },
      { meetingPoint: { contains: location, mode: 'insensitive' as const } },
    ],
  };
};

const buildAvailabilityWhere = (range: DateRange | null) => {
  if (!range) return {};
  const { startDate, endDate } = range;
  return {
    NOT: {
      reservations: {
        some: {
          OR: [
            {
              endDate: { gte: startDate },
              startDate: { lte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: { gte: endDate },
            },
          ],
        },
      },
    },
  };
};

const buildGuestWhere = (guestCount: number | null) =>
  guestCount ? { guestCount: { gte: guestCount } } : {};

const buildListingBadge = (listing: {
  groupStyles?: string[] | null;
  activityForms?: string[] | null;
  environments?: string[] | null;
  durationCategory?: string | null;
}) =>
  listing.groupStyles?.[0] ||
  listing.activityForms?.[0] ||
  listing.environments?.[0] ||
  listing.durationCategory ||
  'Featured';

const sanitizeLocation = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (MONTHS[lower] !== undefined) return null;
  return trimmed;
};

const parseDateValue = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeMemory = (memory?: MemoryPayload) => {
  if (!memory) return { location: null, category: null, dateRange: null, guestCount: null, keywords: [] };
  const parsedStart = memory.dateRange?.startDate ? parseDateValue(memory.dateRange.startDate) : null;
  const parsedEnd = memory.dateRange?.startDate
    ? parseDateValue(memory.dateRange.endDate ?? memory.dateRange.startDate)
    : null;
  const safeDateRange: DateRange | null = parsedStart && parsedEnd ? { startDate: parsedStart, endDate: parsedEnd } : null;
  return {
    location: sanitizeLocation(memory.location ?? null),
    category: memory.category ?? null,
    dateRange: safeDateRange,
    guestCount: typeof memory.guestCount === 'number' ? memory.guestCount : null,
    keywords: Array.isArray(memory.keywords) ? memory.keywords : [],
  };
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateRangeLabel = (range?: DateRange | null) => {
  if (!range) return '';
  const startLabel = formatDateValue(range.startDate);
  const endLabel = formatDateValue(range.endDate);
  return startLabel === endLabel ? startLabel : `${startLabel} → ${endLabel}`;
};

export async function POST(request: Request) {
  const { messages, memory } = (await request.json()) as {
    messages?: RequestMessage[];
    memory?: MemoryPayload;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({
      reply: 'Tell me what you are looking for and I will curate listings for you.',
      recommendations: [],
    });
  }

  const normalizedMessages = messages
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-18);

  const existingMemory = normalizeMemory(memory);
  const lastUserMessage = [...normalizedMessages].reverse().find((message) => message.role === 'user');
  const lastAssistantMessage = [...normalizedMessages]
    .reverse()
    .find((message) => message.role === 'assistant');

  const conversationText = normalizedMessages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ');
  const keywords = extractKeywords(conversationText);
  const dateRange =
    parseDateRange(conversationText) ?? parseNamedDateRange(conversationText) ?? parseSingleDate(conversationText);
  const guestCount = extractGuestCount(conversationText);
  const location = extractLocation(conversationText);
  const matchedCategory = extractCategory(conversationText);
  const standaloneGuestCount =
    lastUserMessage && lastAssistantMessage && isGuestCountPrompt(lastAssistantMessage.content)
      ? parseStandaloneGuestCount(lastUserMessage.content)
      : null;
  const resolvedLocation = location ?? existingMemory.location;
  const resolvedCategory = matchedCategory ?? existingMemory.category;
  const resolvedDateRange = dateRange ?? existingMemory.dateRange;
  const resolvedGuestCount = guestCount ?? standaloneGuestCount ?? existingMemory.guestCount;
  const resolvedKeywords = Array.from(new Set([...existingMemory.keywords, ...keywords]));
  const missingFields: string[] = [];

  if (!resolvedLocation) missingFields.push('location');
  if (!resolvedCategory) missingFields.push('category');
  if (!resolvedDateRange) missingFields.push('dates');
  if (!resolvedGuestCount) missingFields.push('guests');

  const criteriaMet = missingFields.length === 0;

  const memorySnapshot = {
    location: resolvedLocation,
    category: resolvedCategory,
    dateRange: resolvedDateRange
      ? {
          startDate: formatDateValue(resolvedDateRange.startDate),
          endDate: formatDateValue(resolvedDateRange.endDate),
        }
      : null,
    guestCount: resolvedGuestCount,
    keywords: resolvedKeywords,
  };

  if (!criteriaMet) {
    return NextResponse.json({
      reply: buildFollowUpReply({
        missing: missingFields,
        categoryHint: resolvedCategory,
        knownFields: [
          resolvedLocation ? `Location: ${resolvedLocation}` : null,
          resolvedCategory ? `Category: ${resolvedCategory}` : null,
          resolvedDateRange ? `Dates: ${formatDateRangeLabel(resolvedDateRange)}` : null,
          resolvedGuestCount ? `Guests: ${resolvedGuestCount}` : null,
        ].filter(Boolean) as string[],
      }),
      recommendations: [],
      criteriaMet,
      missingFields,
      memory: memorySnapshot,
    });
  }

  const fetchListings = async (where: Record<string, unknown>) =>
    prisma.listing.findMany({
      where,
      take: 8,
    });

  type ListingsTier =
    | 'strict'
    | 'noAvailability'
    | 'noGuests'
    | 'noCategory'
    | 'locationOnly'

  let listingsTier: ListingsTier = 'strict';

  const searchTiers: Array<{
    tier: ListingsTier;
    where: Record<string, unknown>;
  }> = [
    {
      tier: 'strict',
      where: {
        status: 'approved',
        ...buildKeywordWhere(resolvedKeywords),
        ...buildCategoryWhere(resolvedCategory),
        ...buildLocationWhere(resolvedLocation),
        ...buildAvailabilityWhere(resolvedDateRange),
        ...buildGuestWhere(resolvedGuestCount),
      },
      },
    {
      tier: 'noAvailability',
      where: {
        status: 'approved',
        ...buildKeywordWhere(resolvedKeywords),
        ...buildCategoryWhere(resolvedCategory),
        ...buildLocationWhere(resolvedLocation),
        ...buildGuestWhere(resolvedGuestCount),
      },
      },
    {
      tier: 'noGuests',
      where: {
        status: 'approved',
        ...buildKeywordWhere(resolvedKeywords),
        ...buildCategoryWhere(resolvedCategory),
        ...buildLocationWhere(resolvedLocation),
      },
      },
    {
      tier: 'noCategory',
      where: {
        status: 'approved',
        ...buildKeywordWhere(resolvedKeywords),
        ...buildLocationWhere(resolvedLocation),
      },
      },
    {
      tier: 'locationOnly',
      where: {
        status: 'approved',
        ...buildLocationWhere(resolvedLocation),
      },
    },
    
  ];

  let matchedListings: Awaited<ReturnType<typeof fetchListings>> = [];
  for (const tier of searchTiers) {
    // Skip tiers that would be identical to previous when we have no location to filter by.
    if (tier.tier === 'locationOnly' && !resolvedLocation) {
      continue;
    }

    const results = await fetchListings(tier.where);
    if (results.length) {
      matchedListings = results;
      listingsTier = tier.tier;
      break;
    }
  }

const scoreListing = (listing: (typeof matchedListings)[number]) => {
    let score = 0;
    const lowerKeywords = resolvedKeywords.map((keyword) => keyword.toLowerCase());
    const title = (listing.title ?? '').toLowerCase();
    const description = (listing.description ?? '').toLowerCase();
    const locationValue = (listing.locationValue ?? '').toLowerCase();
    const categories = [
      listing.primaryCategory,
      ...(Array.isArray(listing.category) ? listing.category : listing.category ? [listing.category] : []),
    ]
      .filter(Boolean)
      .map((value) => value!.toLowerCase());

    if (resolvedCategory && categories.includes(resolvedCategory.toLowerCase())) score += 5;
    if (resolvedLocation && locationValue.includes(resolvedLocation.toLowerCase())) score += 4;

    lowerKeywords.forEach((keyword) => {
      if (title.includes(keyword)) score += 2;
      if (description.includes(keyword)) score += 1;
      if (locationValue.includes(keyword)) score += 1;
    });

    if (resolvedGuestCount && listing.guestCount && listing.guestCount >= resolvedGuestCount) {
      score += 1;
    }

    return score;
  };

  const bestListing = matchedListings
    .map((listing) => ({ listing, score: scoreListing(listing) }))
    .sort((a, b) => b.score - a.score)[0]?.listing;

  const recommendations = (bestListing ? [bestListing] : []).map((listing) => {
    const rawCategory = Array.isArray(listing.category) ? listing.category[0] : listing.category;
    return {
      id: listing.id,
      slug: listing.slug ?? null,
      title: listing.title,
      category: listing.primaryCategory ?? rawCategory ?? 'General',
      location: listing.locationValue ?? 'Worldwide',
      badge: buildListingBadge(listing),
      description: truncate(listing.description ?? ''),
      image: listing.imageSrc?.[0] ?? '/images/promo-banner-1.jpg',
    };
  });

  if (!matchedListings.length) {
    return NextResponse.json({
      reply:
        `I couldn’t find available listings for ${resolvedLocation ?? 'that destination'} right now, but I’ll keep searching as inventory updates.`,
      recommendations: [],
      criteriaMet,
      missingFields: [],
      memory: memorySnapshot,
    });
  }

  const availabilityNote =
    listingsTier === 'noAvailability'
      ? `I couldn’t confirm availability for ${formatDateRangeLabel(resolvedDateRange)} yet, but here are the closest matches.`
      : listingsTier === 'noGuests'
      ? `I couldn’t match the exact guest count, but these experiences fit your other preferences.`
      : listingsTier === 'noCategory'
      ? `I couldn’t find an exact category match, but these experiences align with your location and keywords.`
      : listingsTier === 'locationOnly'
      ? `I couldn’t match the full criteria, but these are top experiences in ${resolvedLocation}.`
      : '';

  return NextResponse.json({
    reply:
      availabilityNote ||
      `Thanks! I will check availability for ${resolvedLocation} on ${formatDateRangeLabel(
        resolvedDateRange,
      )} for ${resolvedGuestCount} guests and rank the best-reviewed listings.`,
    recommendations,
    criteriaMet,
    missingFields,
    memory: memorySnapshot,
  });
}