export const dynamic = 'force-dynamic';
import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
import { normalizePricingSnapshot } from "@/app/libs/pricing";

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

    const pricingSnapshot = normalizePricingSnapshot(
      listingWithSlug.customPricing,
      listingWithSlug.price,
    );

    const normalizedBasePrice = pricingSnapshot.basePrice > 0
      ? pricingSnapshot.basePrice
      : Number(listingWithSlug.price ?? 0);

    return {
      ...listingWithSlug,
      price: normalizedBasePrice,
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
      customPricing: pricingSnapshot.tiers.length > 0 ? pricingSnapshot.tiers : null,
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
