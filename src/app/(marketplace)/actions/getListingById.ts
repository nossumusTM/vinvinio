export const dynamic = 'force-dynamic';
import prisma from "@/app/(marketplace)/libs/prismadb";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import { normalizePricingSnapshot } from "@/app/(marketplace)/libs/pricing";
import type { Prisma } from '@prisma/client';
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser"; // 👈 NEW

interface IParams {
  listingId?: string;
}

function looksLikeObjectId(value?: string) {
  return !!value && /^[0-9a-fA-F]{24}$/.test(value);
}

type SafePricingTier = { minGuests: number; maxGuests: number; price: number };

export default async function getListingById(params: IParams) {
  try {
    const { listingId } = params;

    const where = looksLikeObjectId(listingId)
      ? { id: listingId! }
      : { slug: listingId! };

    const listing = await prisma.listing.findFirst({
      where,
      include: {
        user: true,
        likes: true, // 👈 make sure this matches your relation name
        _count: {
          select: { likes: true }, // 👈 same here
        },
      },
    });

    if (!listing) {
      return null;
    }

    const listingWithSlug = await ensureListingSlug(listing);

    // 👇 Fetch current user on the server so we can compute likedByCurrentUser
    const currentUser = await getCurrentUser();

    const likesCount = listingWithSlug._count?.likes ?? 0;

    const likedByCurrentUser =
      !!currentUser &&
      Array.isArray(listingWithSlug.likes) &&
      listingWithSlug.likes.some((like) => like.userId === currentUser.id);

    type UserOptionals = {
      bio?: string | null;
      visitedCountries?: string[];
      visitedCities?: string[];
      profession?: string | null;
      identityVerified?: boolean;
      phone?: string | null;
      contact?: string | null;
      legalName?: string | null;
      address?: string | null;
      hostName?: string | null;
    };

    const u = listingWithSlug.user as typeof listingWithSlug.user & UserOptionals;

    const pricingSnapshot = normalizePricingSnapshot(
      listingWithSlug.customPricing,
      listingWithSlug.price,
    );

    const normalizedBasePrice = pricingSnapshot.basePrice > 0
      ? pricingSnapshot.basePrice
      : Number(listingWithSlug.price ?? 0);

    return {
      ...listingWithSlug, // includes slug, etc.
      price: normalizedBasePrice,
      hoursInAdvance: Math.max(0, Number(listingWithSlug.hoursInAdvance ?? 0)),
      updatedAt: listingWithSlug.updatedAt.toISOString(),
      languages: Array.isArray(listingWithSlug.languages)
        ? listingWithSlug.languages
        : [],
      locationType: Array.isArray(listingWithSlug.locationType)
        ? listingWithSlug.locationType
        : [],
      groupStyles: Array.isArray(listingWithSlug.groupStyles)
        ? listingWithSlug.groupStyles
        : [],
      environments: Array.isArray(listingWithSlug.environments)
        ? listingWithSlug.environments
        : [],
      activityForms: Array.isArray(listingWithSlug.activityForms)
        ? listingWithSlug.activityForms
        : [],
      seoKeywords: Array.isArray(listingWithSlug.seoKeywords)
        ? listingWithSlug.seoKeywords
        : [],
      pricingType: pricingSnapshot.mode ?? null,
      groupPrice: pricingSnapshot.groupPrice,
      groupSize: pricingSnapshot.groupSize,
      customPricing:
        pricingSnapshot.tiers.length > 0
          ? (pricingSnapshot.tiers as SafePricingTier[])
          : null,
      createdAt: listingWithSlug.createdAt.toString(),

      // 💗 NEW: like info exposed to the client
      likesCount,
      likedByCurrentUser,

      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        username: u.username ?? null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        emailVerified: u.emailVerified ? u.emailVerified.toISOString() : null,

        // safely supply fields expected by SafeUser (fallbacks if not in schema)
        phone: u.phone ?? null,
        contact: u.contact ?? null,
        legalName: u.legalName ?? null,
        address: u.address ?? null,
        hostName: u.hostName ?? null,

        bio: u.bio ?? null,
        visitedCountries: u.visitedCountries ?? [],
        visitedCities: u.visitedCities ?? [],
        profession: u.profession ?? null,
        identityVerified: Boolean(u.identityVerified),
      },
    };
  } catch (error: any) {
    throw new Error(error);
  }
}
