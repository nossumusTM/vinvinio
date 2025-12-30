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

interface RequestMessage {
  role: 'assistant' | 'user';
  content: string;
}

function lastUserText(messages: { role: string; content: string }[]) {
  return [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
}

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
  const keywords = extractKeywords(prompt);
  const dateRange = parseDateRange(prompt);

  const listings = await prisma.listing.findMany({
    where: {
      status: 'approved',
      ...buildKeywordWhere(keywords),
      ...buildAvailabilityWhere(dateRange),
    },
    orderBy: [{ punti: 'desc' }, { createdAt: 'desc' }],
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
      reply: `Here is a tailored shortlist for "${prompt || 'your trip'}". Pick a city, dates, and guest count so I can surface the right listings.`,
      recommendations,
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
              'You are AI Force, a sales representative for a multibrand travel marketplace called Vuola. Keep responses business-only. Ask for and confirm the customer’s country or city, desired category, travel date(s), and availability needs. If anything is missing, ask concise follow-up questions. Provide short bullet-point guidance and never answer off-topic questions; politely refuse and steer back to listings and bookings.',
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

      return NextResponse.json({ reply, recommendations }, { status: 200 });
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      'Ask me anything about your next stay and I will tailor the results.';

    return NextResponse.json({ reply, recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Force (HF Router) request failed', message);
    return NextResponse.json(
      { reply: 'I could not reach the AI model. Please try again in a moment.', recommendations },
      { status: 200 },
    );
  }
}