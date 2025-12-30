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

interface RequestMessage {
  role: 'assistant' | 'user';
  content: string;
}

function lastUserText(messages: { role: string; content: string }[]) {
  return [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
}

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

const CATEGORY_SUGGESTIONS = CATEGORY_MATCHERS.map((category) => category.label);

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

const parseDateRange = (text: string) => {
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

const extractLocation = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const match = normalized.match(
    /\b(?:in|at|near|around|from|to|country|region|city)\s+([a-zA-Z][a-zA-Z\s-]{2,40})/i,
  );
  if (!match) return null;
  const location = match[1]
    .replace(/\b(for|with|on|in|at|around)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return location || null;
};

const extractGuestCount = (text: string) => {
  const match =
    text.match(/\b(\d{1,2})\s*(guests?|people|persons|travellers|travelers|adults|friends)\b/i) ||
    text.match(/\bfor\s+(\d{1,2})\b(?!\s*(nights?|days?|hours?))/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

const extractCategory = (text: string) => {
  const lower = text.toLowerCase();
  const match = CATEGORY_MATCHERS.find((category) =>
    category.keywords.some((keyword) => lower.includes(keyword)),
  );
  return match?.label ?? null;
};

const formatOptionList = (values: string[], max = 6) =>
  values.slice(0, max).join(', ');

const buildFollowUpReply = (params: {
  greeting?: string;
  missing: string[];
  categoryHint?: string | null;
}) => {
  const focusLine = params.categoryHint
    ? `I can tailor it within "${params.categoryHint}" or something else you prefer.`
    : `Pick a category like ${formatOptionList(CATEGORY_SUGGESTIONS)}.`;

  const prompts: Record<string, string> = {
    location: 'Your country/region or city (or tap “Use my location”).',
    category: `What you are looking for. ${focusLine}`,
    dates: 'Your dates (YYYY-MM-DD to YYYY-MM-DD) so I can check availability.',
    guests: 'Guest count so I can match the right capacity.',
  };

  const missingLines = params.missing.map((key) => `• ${prompts[key]}`).join('\n');

  return [
    params.greeting,
    'To curate the best matches, I just need a few details:',
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

const buildAvailabilityWhere = (range: { startDate: Date; endDate: Date } | null) => {
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

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages?: RequestMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({
      reply: 'Tell me what you are looking for and I will curate listings for you.',
      recommendations: [],
    });
  }

  const normalizedMessages = messages
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-12);

  const hfToken = process.env.HF_TOKEN?.trim() || process.env.HUGGINGFACE_API_KEY?.trim();

  const prompt = lastUserText(normalizedMessages);
  const conversationText = normalizedMessages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ');
  const keywords = extractKeywords(conversationText);
  const dateRange = parseDateRange(conversationText);
  const guestCount = extractGuestCount(conversationText);
  const location = extractLocation(conversationText);
  const matchedCategory = extractCategory(conversationText);
  const missingFields: string[] = [];

  if (!location) missingFields.push('location');
  if (!matchedCategory) missingFields.push('category');
  if (!dateRange) missingFields.push('dates');
  if (!guestCount) missingFields.push('guests');

  const criteriaMet = missingFields.length === 0;

  if (!criteriaMet) {
    return NextResponse.json({
      reply: buildFollowUpReply({ missing: missingFields, categoryHint: matchedCategory }),
      recommendations: [],
      criteriaMet,
      missingFields,
    });
  }

  const listings = await prisma.listing.findMany({
    where: {
      status: 'approved',
      ...buildKeywordWhere(keywords),
      ...buildAvailabilityWhere(dateRange),
      ...buildGuestWhere(guestCount),
    },
    orderBy: [{ punti: 'desc' }, { likesCount: 'desc' }, { createdAt: 'desc' }],
    take: 5,
  });

  const recommendations = listings.map((listing) => {
    const rawCategory = Array.isArray(listing.category) ? listing.category[0] : listing.category;
    return {
      id: listing.id,
      title: listing.title,
      category: listing.primaryCategory ?? rawCategory ?? 'General',
      location: listing.locationValue ?? 'Worldwide',
      badge: buildListingBadge(listing),
      description: truncate(listing.description ?? ''),
      image: listing.imageSrc?.[0] ?? '/images/promo-banner-1.jpg',
    };
  });

  if (!hfToken) {
    // const prompt = lastUserText(normalizedMessages);
    return NextResponse.json({
      reply: `Thanks! I will check availability for ${location} on ${dateRange?.startDate.toISOString().slice(0, 10)} → ${dateRange?.endDate.toISOString().slice(0, 10)} for ${guestCount} guests and rank the best-reviewed listings.`,
      recommendations,
      criteriaMet,
      missingFields,
    });
  }

  // Pick a router-compatible chat model.
  // Docs examples show using model IDs like "moonshotai/Kimi-K2-Instruct-0905". :contentReference[oaicite:5]{index=5}
  // Another docs example references "openai/gpt-oss-120b" (open-weights conversational). :contentReference[oaicite:6]{index=6}
  const model = process.env.HF_CHAT_MODEL?.trim() || 'openai/gpt-oss-120b';

  try {
    const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              `You are AI Force, a sales representative for a multibrand travel marketplace called Vuola. Keep responses business-only. Confirm the customer's country/region (${location}), category (${matchedCategory}), travel date(s), and guest count. Explain that you will check availability and rank listings by reviews. Offer concise bullet points and avoid off-topic replies.`,
          },
          {
            role: 'assistant',
            content: `Structured categories include: Categories (${formatOptionList(CATEGORY_SUGGESTIONS)}), Group styles (${formatOptionList(
              GROUP_STYLE_OPTIONS.map((option) => option.label),
            )}), Environments (${formatOptionList(ENVIRONMENT_OPTIONS.map((option) => option.label))}), Duration (${formatOptionList(
              DURATION_OPTIONS.map((option) => option.label),
            )}), Activity forms (${formatOptionList(ACTIVITY_FORM_OPTIONS.map((option) => option.label))}).`,
          },
          ...normalizedMessages,
        ],
        temperature: 0.4,
        max_tokens: 280,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('AI Force (HF Router) request failed', { status: res.status, errorText });

      const reply =
        res.status === 429
          ? 'AI Force is at capacity right now. Please try again soon.'
          : 'I could not reach the AI model. Please try again in a moment.';

      return NextResponse.json(
        { reply, recommendations, criteriaMet, missingFields },
        { status: 200 },
      );
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      'Ask me anything about your next stay and I will tailor the results.';

    return NextResponse.json({ reply, recommendations, criteriaMet, missingFields });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Force (HF Router) request failed', message);
    return NextResponse.json(
{
        reply: 'I could not reach the AI model. Please try again in a moment.',
        recommendations,
        criteriaMet,
        missingFields,
      },
      { status: 200 },
    );
  }
}