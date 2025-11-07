import { notFound } from 'next/navigation';

import prisma from '@/app/(marketplace)/libs/prismadb';
import { hrefForListing } from '@/app/(marketplace)/libs/links';
import type {
  SocialCardVisitedPlace,
  SocialCardVisibility,
} from '@/app/(marketplace)/types';

import PublicSocialCard, {
  BookingSummary,
  ReviewSummary,
} from './PublicSocialCard';

export const dynamic = 'force-dynamic';

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  image: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  countries: true,
  cities: true,
  profession: true,
  hobbies: true,
  contacts: true,
};

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

const normalizeVisibility = (input: unknown): Record<string, boolean> => {
  const merged = { ...DEFAULT_VISIBILITY };

  if (!input || typeof input !== 'object') {
    return merged;
  }

  Object.keys(merged).forEach((key) => {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value === 'boolean') {
      merged[key] = value;
    }
  });

  return merged;
};

const mapVisitedPlaces = (value: unknown): SocialCardVisitedPlace[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const countryCode = (entry as Record<string, unknown>).countryCode;
      const countryName = (entry as Record<string, unknown>).countryName;
      const city = (entry as Record<string, unknown>).city;

      if (typeof countryCode !== 'string' || typeof countryName !== 'string') {
        return null;
      }

      return {
        countryCode: countryCode.trim().toUpperCase(),
        countryName: countryName.trim(),
        city: typeof city === 'string' ? city.trim() : undefined,
      } satisfies SocialCardVisitedPlace;
    })
    .filter((place): place is SocialCardVisitedPlace => Boolean(place?.countryCode && place?.countryName));
};

const SocialCardSharePage = async ({
  params,
}: {
  params: { username: string };
}) => {
  const rawParam = decodeURIComponent(params.username ?? '').trim();
  const sanitizedParam = rawParam.replace(/^@/, '');

  if (!sanitizedParam) {
    notFound();
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          username: {
            equals: sanitizedParam,
            mode: 'insensitive',
          },
        },
        ...(OBJECT_ID_RE.test(sanitizedParam) ? [{ id: sanitizedParam }] : []),
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      legalName: true,
      image: true,
      profession: true,
      bio: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      socialCardVisibility: true,
      socialCardIsPublic: true,
      visitedPlaces: true,
      hobbies: true,
      preferredContacts: true,
      contact: true,
      isSuspended: true,
    },
  });

  if (!user) {
    notFound();
  }

  if (!user.socialCardIsPublic) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-2xl font-semibold text-neutral-900">This social card is private.</p>
        <p className="mt-2 text-sm text-neutral-600">
          The owner has chosen not to share their social card publicly.
        </p>
      </div>
    );
  }

  const visibility = normalizeVisibility(user.socialCardVisibility as SocialCardVisibility | null);
  const visitedPlaces = mapVisitedPlaces(user.visitedPlaces);
  const displayedName = user.legalName || user.name || 'Anonymous traveller';
  const email = user.email || null;
  const phone = user.phone || null;

  const preferredContacts = Array.isArray(user.preferredContacts) && user.preferredContacts.length
    ? user.preferredContacts
    : user.contact
    ? user.contact
        .split(/\n|,|;/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  const contactDisplay = preferredContacts.length
    ? preferredContacts
    : ['Contact details not shared yet'];

  const hobbies = Array.isArray(user.hobbies)
    ? user.hobbies.filter((entry): entry is string => typeof entry === 'string')
    : [];

  const [reservations, reviews] = await Promise.all([
    prisma.reservation.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            primaryCategory: true,
            imageSrc: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            primaryCategory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const bookings: BookingSummary[] = reservations.map((reservation) => {
    const listing = reservation.listing;
    const listingHref = listing ? hrefForListing(listing) : '#';
    const coverImage = Array.isArray(listing?.imageSrc) ? listing?.imageSrc[0] : null;

    return {
      id: reservation.id,
      listingTitle: listing?.title ?? 'Experience',
      listingHref,
      coverImage,
      startDate: reservation.startDate?.toISOString?.() ?? reservation.startDate?.toString?.() ?? null,
      endDate: reservation.endDate?.toISOString?.() ?? reservation.endDate?.toString?.() ?? null,
      createdAt: reservation.createdAt?.toISOString?.() ?? reservation.createdAt.toString(),
    } satisfies BookingSummary;
  });

  const reviewSummaries: ReviewSummary[] = reviews.map((review) => {
    const listing = review.listing;
    const listingHref = listing ? hrefForListing(listing) : '#';

    return {
      id: review.id,
      rating: review.rating ?? 0,
      comment: review.comment ?? '',
      createdAt: review.createdAt?.toISOString?.() ?? review.createdAt.toString(),
      listingTitle: listing?.title ?? 'Experience',
      listingHref,
    } satisfies ReviewSummary;
  });

  return (
    <PublicSocialCard
      user={{
        id: user.id,
        username: user.username ?? null,
        displayedName,
        image: user.image ?? null,
        profession: user.profession ?? null,
        bio: user.bio ?? null,
        email,
        phone,
        emailVerified: Boolean(user.emailVerified),
        phoneVerified: Boolean(user.phoneVerified),
        isSuspended: Boolean(user.isSuspended),
      }}
      visibility={visibility}
      visitedPlaces={visitedPlaces}
      contactDisplay={contactDisplay}
      hobbies={hobbies}
      bookings={bookings}
      reviews={reviewSummaries}
    />
  );
};

export default SocialCardSharePage;
