export const dynamic = 'force-dynamic';
import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";

interface CustomPricingTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

interface IParams {
  listingId?: string;
}

export default async function getListingById(params: IParams) {
  try {
    const { listingId } = params;

    const listing = await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      include: {
        user: true,
      },
    });

    if (!listing) {
      return null;
    }

    const listingWithSlug = await ensureListingSlug(listing);

    const normalizedCustomPricing = Array.isArray(listingWithSlug.customPricing)
      ? (listingWithSlug.customPricing as unknown[])
          .map((tier) => {
            if (!tier || typeof tier !== "object") {
              return null;
            }

            const tierRecord = tier as Record<string, unknown>;

            return {
              minGuests: Number(tierRecord.minGuests ?? 0),
              maxGuests: Number(tierRecord.maxGuests ?? 0),
              price: Number(tierRecord.price ?? 0),
            };
          })
          .filter((tier): tier is CustomPricingTier => {
            if (!tier) {
              return false;
            }

            return (
              Number.isFinite(tier.minGuests) &&
              Number.isFinite(tier.maxGuests) &&
              Number.isFinite(tier.price) &&
              tier.minGuests > 0 &&
              tier.maxGuests >= tier.minGuests &&
              tier.price > 0
            );
          })
      : [];

    return {
      ...listingWithSlug,
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
      pricingType: listingWithSlug.pricingType ?? null,
      groupPrice: listingWithSlug.groupPrice ?? null,
      groupSize: listingWithSlug.groupSize ?? null,
      customPricing:
        normalizedCustomPricing.length > 0 ? normalizedCustomPricing : null,
      createdAt: listingWithSlug.createdAt.toString(),
      user: {
        ...listingWithSlug.user,
        createdAt: listingWithSlug.user.createdAt.toString(),
        updatedAt: listingWithSlug.user.updatedAt.toString(),
        emailVerified: listingWithSlug.user.emailVerified?.toString() || null,
      },
    };
  } catch (error: any) {
    throw new Error(error);
  }
}
