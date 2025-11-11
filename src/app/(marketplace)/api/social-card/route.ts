import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import type {
  SocialCardVisitedPlace,
  SocialCardVisibility,
} from '@/app/(marketplace)/types';

export const dynamic = 'force-dynamic';

const normalizeVisibility = (input: unknown): SocialCardVisibility => {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const record: SocialCardVisibility = {};
  const truthy = new Set([
    'image',
    'name',
    'email',
    'phone',
    'bio',
    'countries',
    'cities',
    'profession',
    'hobbies',
    'contacts',
  ]);

  truthy.forEach((key) => {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value === 'boolean') {
      (record as Record<string, boolean>)[key] = value;
    }
  });

  return record;
};

const normalizeVisitedPlaces = (input: unknown): SocialCardVisitedPlace[] => {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;

      const rec = entry as Record<string, unknown>;
      const ccRaw = rec.countryCode;
      const cnRaw = rec.countryName;
      const cityRaw = rec.city;

      if (typeof ccRaw !== 'string' || typeof cnRaw !== 'string') return null;

      const countryCode = ccRaw.trim().toUpperCase();
      const countryName = cnRaw.trim();
      const city =
        typeof cityRaw === 'string' && cityRaw.trim().length > 0
          ? cityRaw.trim()
          : null; // allow null per type

      if (!countryCode || !countryName) return null;

      const key = `${countryCode}::${city ?? ''}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        countryCode,
        countryName,
        city, // string | null
      } as SocialCardVisitedPlace;
    })
    .filter((p): p is SocialCardVisitedPlace => p !== null);
};


export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        profession: true,
        bio: true,
        hobbies: true,
        visitedPlaces: true,
        socialCardVisibility: true,
        socialCardIsPublic: true,
        visitedCountries: true,
        visitedCities: true,
      },
    });

    if (!user) {
      return new NextResponse('Not found', { status: 404 });
    }

    return NextResponse.json({
      profession: user.profession ?? '',
      journey: user.bio ?? '',
      hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
      visitedPlaces: Array.isArray(user.visitedPlaces)
        ? (user.visitedPlaces as SocialCardVisitedPlace[])
        : [],
      visibility:
        user.socialCardVisibility && typeof user.socialCardVisibility === 'object'
          ? (user.socialCardVisibility as SocialCardVisibility)
          : {},
      isPublic: typeof user.socialCardIsPublic === 'boolean' ? user.socialCardIsPublic : true,
      visitedCountries: Array.isArray(user.visitedCountries) ? user.visitedCountries : [],
      visitedCities: Array.isArray(user.visitedCities) ? user.visitedCities : [],
    });
  } catch (error) {
    console.error('[SOCIAL_CARD_GET]', error);
    return new NextResponse('Failed to load social card', { status: 500 });
  }
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const profession = typeof body.profession === 'string' ? body.profession.trim() : undefined;
  const journey = typeof body.journey === 'string' ? body.journey.trim() : undefined;
  const hobbies = Array.isArray(body.hobbies)
    ? body.hobbies
        .map((entry: unknown) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry: string) => entry.length > 0)
    : undefined;
  const visibility = normalizeVisibility(body.visibility);
  const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : undefined;
  const visitedPlaces = normalizeVisitedPlaces(body.visitedPlaces);

  try {
    const data: Record<string, unknown> = {};

    if (typeof profession === 'string') {
      data.profession = profession;
    }

    if (typeof journey === 'string') {
      data.bio = journey;
    }

    if (hobbies) {
      data.hobbies = hobbies;
    }

    if (isPublic !== undefined) {
      data.socialCardIsPublic = isPublic;
    }

    if (visitedPlaces.length > 0 || Array.isArray(body.visitedPlaces)) {
      data.visitedPlaces = visitedPlaces;
      data.visitedCountries = Array.from(
        new Set(visitedPlaces.map((place) => place.countryName))
      );
      data.visitedCities = visitedPlaces.map((place) =>
        place.city ? `${place.city}, ${place.countryName}` : place.countryName
      );
    }

    if (Object.keys(visibility).length > 0 || body.visibility) {
      data.socialCardVisibility = visibility;
    }

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data,
      select: {
        profession: true,
        bio: true,
        hobbies: true,
        visitedPlaces: true,
        socialCardVisibility: true,
        socialCardIsPublic: true,
        visitedCountries: true,
        visitedCities: true,
      },
    });

    return NextResponse.json({
      profession: updated.profession ?? '',
      journey: updated.bio ?? '',
      hobbies: Array.isArray(updated.hobbies) ? updated.hobbies : [],
      visitedPlaces: Array.isArray(updated.visitedPlaces)
        ? (updated.visitedPlaces as SocialCardVisitedPlace[])
        : [],
      visibility:
        updated.socialCardVisibility && typeof updated.socialCardVisibility === 'object'
          ? (updated.socialCardVisibility as SocialCardVisibility)
          : {},
      isPublic:
        typeof updated.socialCardIsPublic === 'boolean' ? updated.socialCardIsPublic : true,
      visitedCountries: Array.isArray(updated.visitedCountries) ? updated.visitedCountries : [],
      visitedCities: Array.isArray(updated.visitedCities) ? updated.visitedCities : [],
    });
  } catch (error) {
    console.error('[SOCIAL_CARD_PUT]', error);
    return new NextResponse('Failed to update social card', { status: 500 });
  }
}
