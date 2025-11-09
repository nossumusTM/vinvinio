// import { notFound } from 'next/navigation';

// import prisma from '@/app/(marketplace)/libs/prismadb';
// import { hrefForListing } from '@/app/(marketplace)/libs/links';
// import { findUserIdByHandle } from '@/app/(marketplace)/libs/userHandles';
// import type {
//   SocialCardVisitedPlace,
//   SocialCardVisibility,
// } from '@/app/(marketplace)/types';

// import PublicSocialCard, {
//   BookingSummary,
//   ReviewSummary,
// } from './PublicSocialCard';

// export const dynamic = 'force-dynamic';

// const DEFAULT_VISIBILITY: Record<string, boolean> = {
//   image: true,
//   name: true,
//   email: true,
//   phone: true,
//   bio: true,
//   countries: true,
//   cities: true,
//   profession: true,
//   hobbies: true,
//   contacts: true,
// };

// const normalizeVisibility = (input: unknown): Record<string, boolean> => {
//   const merged = { ...DEFAULT_VISIBILITY };

//   if (!input || typeof input !== 'object') {
//     return merged;
//   }

//   Object.keys(merged).forEach((key) => {
//     const value = (input as Record<string, unknown>)[key];
//     if (typeof value === 'boolean') {
//       merged[key] = value;
//     }
//   });

//   return merged;
// };

// const mapVisitedPlaces = (value: unknown): SocialCardVisitedPlace[] => {
//   if (!Array.isArray(value)) {
//     return [];
//   }

//   return value
//     .map((entry) => {
//       if (!entry || typeof entry !== 'object') return null;
//       const countryCode = (entry as Record<string, unknown>).countryCode;
//       const countryName = (entry as Record<string, unknown>).countryName;
//       const city = (entry as Record<string, unknown>).city;

//       if (typeof countryCode !== 'string' || typeof countryName !== 'string') {
//         return null;
//       }

//       return {
//         countryCode: countryCode.trim().toUpperCase(),
//         countryName: countryName.trim(),
//         city: typeof city === 'string' ? city.trim() : undefined,
//       } satisfies SocialCardVisitedPlace;
//     })
//     .filter((place): place is SocialCardVisitedPlace => Boolean(place?.countryCode && place?.countryName));
// };

// const SocialCardSharePage = async ({
//   params,
// }: {
//   params: { username: string };
// }) => {
//   let candidate = params.username ?? '';

//   try {
//     candidate = decodeURIComponent(candidate);
//   } catch {
//     // keep the raw candidate if decoding fails
//   }

//   const userId = await findUserIdByHandle(candidate);

//   if (!userId) {
//     notFound();
//   }

//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: {
//       id: true,
//       username: true,
//       name: true,
//       legalName: true,
//       image: true,
//       profession: true,
//       bio: true,
//       email: true,
//       phone: true,
//       emailVerified: true,
//       phoneVerified: true,
//       socialCardVisibility: true,
//       socialCardIsPublic: true,
//       visitedPlaces: true,
//       hobbies: true,
//       preferredContacts: true,
//       contact: true,
//       isSuspended: true,
//     },
//   });

//   if (!user) {
//     notFound();
//   }

//   if (!user.socialCardIsPublic) {
//     return (
//       <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
//         <p className="text-2xl font-semibold text-neutral-900">This social card is private.</p>
//         <p className="mt-2 text-sm text-neutral-600">
//           The owner has chosen not to share their social card publicly.
//         </p>
//       </div>
//     );
//   }

//   const visibility = normalizeVisibility(user.socialCardVisibility as SocialCardVisibility | null);
//   const visitedPlaces = mapVisitedPlaces(user.visitedPlaces);
//   const displayedName = user.legalName || user.name || 'Anonymous traveller';
//   const email = user.email || null;
//   const phone = user.phone || null;

//   const preferredContacts = Array.isArray(user.preferredContacts) && user.preferredContacts.length
//     ? user.preferredContacts
//     : user.contact
//     ? user.contact
//         .split(/\n|,|;/)
//         .map((entry) => entry.trim())
//         .filter(Boolean)
//     : [];
//   const contactDisplay = preferredContacts.length
//     ? preferredContacts
//     : ['Contact details not shared yet'];

//   const hobbies = Array.isArray(user.hobbies)
//     ? user.hobbies.filter((entry): entry is string => typeof entry === 'string')
//     : [];

//   const [reservations, reviews] = await Promise.all([
//     prisma.reservation.findMany({
//       where: { userId: user.id },
//       select: {
//         id: true,
//         listingId: true,
//         startDate: true,
//         endDate: true,
//         createdAt: true,
//       },
//       orderBy: { startDate: 'desc' },
//     }),
//     prisma.review.findMany({
//       where: { userId: user.id },
//       select: {
//         id: true,
//         rating: true,
//         comment: true,
//         createdAt: true,
//         listingId: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     }),
//   ]);

//   const listingIds = new Set<string>();
//   reservations.forEach((reservation) => {
//     if (typeof reservation.listingId === 'string' && reservation.listingId.length > 0) {
//       listingIds.add(reservation.listingId);
//     }
//   });
//   reviews.forEach((review) => {
//     if (typeof review.listingId === 'string' && review.listingId.length > 0) {
//       listingIds.add(review.listingId);
//     }
//   });

//   const listingRecords = listingIds.size
//     ? await prisma.listing.findMany({
//         where: { id: { in: Array.from(listingIds) } },
//         select: {
//           id: true,
//           title: true,
//           slug: true,
//           category: true,
//           primaryCategory: true,
//           imageSrc: true,
//         },
//       })
//     : [];

//   const listingsById = new Map(listingRecords.map((listing) => [listing.id, listing]));

//   const bookings: BookingSummary[] = reservations.map((reservation) => {
//     const listing = listingsById.get(reservation.listingId);
//     const listingHref = listing ? hrefForListing(listing) : '#';
//     const coverImage = listing && Array.isArray(listing.imageSrc) && listing.imageSrc.length > 0 ? listing.imageSrc[0] : null;

//     return {
//       id: reservation.id,
//       listingTitle: listing?.title ?? 'Experience',
//       listingHref,
//       coverImage,
//       startDate: reservation.startDate?.toISOString?.() ?? reservation.startDate?.toString?.() ?? null,
//       endDate: reservation.endDate?.toISOString?.() ?? reservation.endDate?.toString?.() ?? null,
//       createdAt: reservation.createdAt?.toISOString?.() ?? reservation.createdAt.toString(),
//     } satisfies BookingSummary;
//   });

//   const reviewSummaries: ReviewSummary[] = reviews.map((review) => {
//     const listing = listingsById.get(review.listingId);
//     const listingHref = listing ? hrefForListing(listing) : '#';

//     return {
//       id: review.id,
//       rating: review.rating ?? 0,
//       comment: review.comment ?? '',
//       createdAt: review.createdAt?.toISOString?.() ?? review.createdAt.toString(),
//       listingTitle: listing?.title ?? 'Experience',
//       listingHref,
//     } satisfies ReviewSummary;
//   });

//   return (
//     <PublicSocialCard
//       user={{
//         id: user.id,
//         username: user.username ?? null,
//         displayedName,
//         image: user.image ?? null,
//         profession: user.profession ?? null,
//         bio: user.bio ?? null,
//         email,
//         phone,
//         emailVerified: Boolean(user.emailVerified),
//         phoneVerified: Boolean(user.phoneVerified),
//         isSuspended: Boolean(user.isSuspended),
//       }}
//       visibility={visibility}
//       visitedPlaces={visitedPlaces}
//       contactDisplay={contactDisplay}
//       hobbies={hobbies}
//       bookings={bookings}
//       reviews={reviewSummaries}
//     />
//   );
// };

// export default SocialCardSharePage;

import { notFound } from 'next/navigation';

import prisma from '@/app/(marketplace)/libs/prismadb';
import { hrefForListing } from '@/app/(marketplace)/libs/links';
import { findUserIdByHandle } from '@/app/(marketplace)/libs/userHandles';
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

/**
 * Strongly types the visited-places mapping and guarantees we only return valid items.
 * Also normalizes city to string|null to match the SocialCardVisitedPlace type.
 */
const mapVisitedPlaces = (value: unknown): SocialCardVisitedPlace[] => {
  if (!Array.isArray(value)) return [];
  const out: SocialCardVisitedPlace[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const cc   = (entry as any).countryCode;
    const cn   = (entry as any).countryName;
    const city = (entry as any).city;
    if (typeof cc !== 'string' || typeof cn !== 'string') continue;
    out.push({
      countryCode: cc.trim().toUpperCase(),
      countryName: cn.trim(),
      city: typeof city === 'string' ? city.trim() : null,
    });
  }
  return out;
};

const SocialCardSharePage = async ({
  params,
}: {
  params: { username: string };
}) => {
  // Handle username/handle from the URL. Accept raw id fallback too.
  let candidate = params.username ?? '';
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // keep as-is if decoding fails
  }
  const handle = candidate.replace(/^@/, '').trim().toLowerCase();

  // Resolve to userId by handle first; fallback to direct id lookup.
  const userId =
    (await findUserIdByHandle(handle)) ??
    (await prisma.user.findUnique({ where: { id: handle }, select: { id: true } }))?.id;

  if (!userId) {
    notFound();
  }

  // Fetch the user WITHOUT a `select` block to avoid TS drift if your schema changes.
  // We'll access optional fields via `any` to prevent TS errors when fields don't exist.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    notFound();
  }
  const u: any = user; // schema-agnostic access for optional/feature fields

  // Public toggle (default to true if field is absent)
  const isPublic: boolean = typeof u?.socialCardIsPublic === 'boolean' ? u.socialCardIsPublic : true;
  if (!isPublic) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-2xl font-semibold text-neutral-900">This social card is private.</p>
        <p className="mt-2 text-sm text-neutral-600">
          The owner has chosen not to share their social card publicly.
        </p>
      </div>
    );
  }

  // Visibility & profile basics
  const visibility = normalizeVisibility((u?.socialCardVisibility as SocialCardVisibility | null) ?? null);
  const visitedPlaces = mapVisitedPlaces(u?.visitedPlaces);
  const displayedName = u?.legalName || u?.name || 'Anonymous traveller';
  const email = (typeof u?.email === 'string' ? u.email : null) ?? null;
  const phone = (typeof u?.phone === 'string' ? u.phone : null) ?? null;

  // Contacts (preferred first, fall back to free-text contact split)
  const preferredContacts: string[] =
    Array.isArray(u?.preferredContacts) && u.preferredContacts.length
      ? u.preferredContacts
      : typeof u?.contact === 'string'
        ? u.contact.split(/\n|,|;/).map((s: string) => s.trim()).filter(Boolean)
        : [];
  const contactDisplay = preferredContacts.length
    ? preferredContacts
    : ['Contact details not shared yet'];

  // Hobbies (only strings)
  const hobbies: string[] = Array.isArray(u?.hobbies)
    ? u.hobbies.filter((entry: unknown): entry is string => typeof entry === 'string')
    : [];

  // Load reservations & reviews by this user
  const [reservations, reviews] = await Promise.all([
    prisma.reservation.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        listingId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        listingId: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Collect unique listing ids
  const listingIds = new Set<string>();
  for (const r of reservations) {
    if (typeof r.listingId === 'string' && r.listingId.length > 0) listingIds.add(r.listingId);
  }
  for (const rv of reviews) {
    if (typeof rv.listingId === 'string' && rv.listingId.length > 0) listingIds.add(rv.listingId);
  }

  // Fetch listing metadata for hrefs and covers
  const listingRecords = listingIds.size
    ? await prisma.listing.findMany({
        where: { id: { in: Array.from(listingIds) } },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          primaryCategory: true,
          imageSrc: true,
        },
      })
    : [];
  const listingsById = new Map(listingRecords.map((l) => [l.id, l]));

  // Map bookings (reservations) to summaries
  const bookings: BookingSummary[] = reservations.map((reservation) => {
    const listing = listingsById.get(reservation.listingId);
    const listingHref = listing ? hrefForListing(listing) : '#';
    const coverImage =
      listing && Array.isArray(listing.imageSrc) && listing.imageSrc.length > 0
        ? (listing.imageSrc[0] as string)
        : null;

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

  // Map reviews to summaries
  const reviewSummaries: ReviewSummary[] = reviews.map((review) => {
    const listing = listingsById.get(review.listingId);
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

  // Build PublicSocialCard props. We pass the URL handle as `username` to avoid
  // touching a potentially missing DB field.
  return (
    <PublicSocialCard
      user={{
        id: user.id,
        username: handle, // URL handle as the username slug
        displayedName,
        image: u?.image ?? null,
        profession: u?.profession ?? null,
        bio: u?.bio ?? null,
        email,
        phone,
        emailVerified: Boolean(u?.emailVerified),
        phoneVerified: Boolean(u?.phoneVerified),
        isSuspended: Boolean(u?.isSuspended),
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