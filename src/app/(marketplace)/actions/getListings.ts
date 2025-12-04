import prisma from "@/app/(marketplace)/libs/prismadb";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import { normalizePricingSnapshot } from "@/app/(marketplace)/libs/pricing";
import type { SafeListing, SafeUser } from "@/app/(marketplace)/types";
import { Prisma } from "@prisma/client";
import { buildListingsWhereClause } from "./listingFilters";
import type { IListingsParams } from "./listings.types";
export type { IListingsParams } from "./listings.types";
import { LANGUAGE_OPTIONS } from "@/app/(marketplace)/constants/locale"
export const dynamic = 'force-dynamic';

export default async function getListings(
  params: IListingsParams,
): Promise<SafeListing[]> {
  try {
    const { sort } = params;

    const toKebab = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const dedupe = <T extends string>(arr: T[]) => Array.from(new Set(arr));
    const toArrayStr = (v: string | string[] | undefined) =>
      Array.isArray(v) ? v : (typeof v === 'string' ? [v] : []);

    // keywords: accept "street food" and "street-food"
    const seoArr = toArrayStr(params.seoKeywords).map(s => s.trim()).filter(Boolean);
    const normalizedSeo =
      seoArr.length ? dedupe<string>([...seoArr, ...seoArr.map(toKebab)]) : undefined;

    // languages: lowercase and add base code (e.g., "pt-BR" -> ["pt-br","pt"])
    const langArr = toArrayStr(params.languages).map(s => s.trim()).filter(Boolean);
    const normalizedLangs =
      langArr.length
        ? dedupe<string>(
            langArr.flatMap((l) => {
              const lc = l.toLowerCase();
              return lc.includes('-') ? [lc, lc.split('-')[0]] : [lc];
            }),
          )
        : undefined;

    const normalizedParams: IListingsParams = {
      ...params,
      seoKeywords: normalizedSeo,
      languages: normalizedLangs,
    };

    const codeToNameLower = new Map(
      LANGUAGE_OPTIONS.map((o) => [o.code.toLowerCase(), o.language.toLowerCase()])
    );
    // Turn requested languages (codes or names) into lowercased full names
    const requestedLangNamesLower = (() => {
      const raw = Array.isArray(params.languages)
        ? params.languages
        : (typeof params.languages === "string" ? [params.languages] : []);
      const cleaned = raw.map((s) => s.trim().toLowerCase()).filter(Boolean);
      const expanded = cleaned.flatMap((token) => {
        // try exact code and its base (e.g., "en-gb" -> ["en-gb","en"])
        const candidates = token.includes("-") ? [token, token.split("-")[0]] : [token];
        const names = candidates
          .map((c) => codeToNameLower.get(c))
          .filter(Boolean) as string[];
        // if none mapped, assume user passed a full name already (e.g., "english")
        return names.length ? names : [token];
      });
      return Array.from(new Set(expanded));
    })();

    const backfillMissingUpdatedAt = (
      collection: "Listing" | "User",
    ): Prisma.InputJsonObject => ({
      update: collection,
      updates: [
        {
          q: {
            $or: [
              { updatedAt: { $exists: false } },
              { updatedAt: null },
            ],
          },
          u: [
            {
              $set: {
                updatedAt: {
                  $ifNull: [
                    "$updatedAt",
                    { $ifNull: ["$createdAt", "$$NOW"] },
                  ],
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await Promise.all([
      prisma.$runCommandRaw(backfillMissingUpdatedAt("Listing")),
      prisma.$runCommandRaw(backfillMissingUpdatedAt("User")),
    ]);

    // const query = buildListingsWhereClause(normalizedParams);
    const query = buildListingsWhereClause({
        ...normalizedParams,
        languages: undefined,
     });

    const shouldOrderByPunti = !sort || sort === 'relevance';
      const orderBy = shouldOrderByPunti
        ? [{ punti: 'desc' as const }, { createdAt: 'desc' as const }]
        : undefined;

    const listings = await prisma.listing.findMany({
      where: query,
      // orderBy: {
      //   createdAt: "desc",
      // },
      orderBy,
      include: {
        user: true,
        reviews: true, // include related reviews
      },
      skip: params.skip ?? 0,
      take: params.take ?? 12,
    });

    

      const resultListings =
      requestedLangNamesLower.length === 0
        ? listings
        : listings.filter((l) => {
            const row = Array.isArray(l.languages)
              ? l.languages.map((x) => String(x).toLowerCase())
              : [];
            return requestedLangNamesLower.some((reqName) => row.includes(reqName));
          });

    const listingsWithSlug = await Promise.all(
       resultListings.map((listing) => ensureListingSlug(listing))
    );

    const decoratedListings = listingsWithSlug.map((listing) => {
      const totalRating = listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      // const avgRating = listing.reviews.length > 0 ? totalRating / listing.reviews.length : 0;
      const reviewsCount = listing.reviews.length;
      const avgRating = reviewsCount > 0 ? totalRating / reviewsCount : 0;

      const pricingSnapshot = normalizePricingSnapshot(listing.customPricing, listing.price);

      const { reviews: _reviews, user, ...listingWithoutRelations } = listing;

      const baseListing = listingWithoutRelations as unknown as Omit<
        SafeListing,
        |
          'user'
          | 'price'
          | 'pricingType'
          | 'groupPrice'
          | 'groupSize'
          | 'customPricing'
          | 'languages'
          | 'locationType'
          | 'groupStyles'
          | 'environments'
          | 'activityForms'
          | 'seoKeywords'
      >;

      const prismaUser = user as unknown as SafeUser & {
        visitedCountries?: string[];
        visitedCities?: string[];
        hobbies?: string[];
        preferredContacts?: string[];
        bio?: string | null;
        profession?: string | null;
        identityVerified?: boolean;
      };

      const safeUser: SafeUser = {
        ...(prismaUser as SafeUser),
        createdAt: user.createdAt.toISOString(),
        updatedAt: (user.updatedAt ?? user.createdAt).toISOString(),
        emailVerified: user.emailVerified?.toISOString() || null,
        bio: prismaUser.bio ?? null,
        visitedCountries: Array.isArray(prismaUser.visitedCountries) ? [...prismaUser.visitedCountries] : [],
        visitedCities: Array.isArray(prismaUser.visitedCities) ? [...prismaUser.visitedCities] : [],
        profession: prismaUser.profession ?? null,
        hobbies: Array.isArray(prismaUser.hobbies) ? [...prismaUser.hobbies] : [],
        preferredContacts: Array.isArray(prismaUser.preferredContacts) ? [...prismaUser.preferredContacts] : [],
        identityVerified: typeof prismaUser.identityVerified === 'boolean' ? prismaUser.identityVerified : false,
        followersCount: typeof prismaUser.followersCount === 'number' ? prismaUser.followersCount : 0,
        allTimeBookingCount: typeof prismaUser.allTimeBookingCount === 'number' ? prismaUser.allTimeBookingCount : 0,
        platformRelevance: typeof prismaUser.platformRelevance === 'number' ? prismaUser.platformRelevance : 0,
        partnerCommissionChangeCount:
          typeof prismaUser.partnerCommissionChangeCount === 'number'
            ? prismaUser.partnerCommissionChangeCount
            : 0,
        partnerCommissionChangeWindowStart: user.partnerCommissionChangeWindowStart ?? null,
      };

      const safeListing: SafeListing = {
        ...baseListing,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: (listing.updatedAt ?? listing.createdAt).toISOString(),
        platformRelevance: typeof safeUser.platformRelevance === 'number' ? safeUser.platformRelevance : 0,
        reviewsCount,
        avgRating,
        price: pricingSnapshot.basePrice > 0 ? pricingSnapshot.basePrice : listing.price,
        pricingType: pricingSnapshot.mode ?? null,
        groupPrice: pricingSnapshot.groupPrice,
        groupSize: pricingSnapshot.groupSize,
        customPricing: pricingSnapshot.tiers.length > 0 ? pricingSnapshot.tiers.map((tier) => ({ ...tier })) : null,
        languages: Array.isArray(listing.languages) ? [...listing.languages] : [],
        locationType: Array.isArray(listing.locationType) ? [...listing.locationType] : [],
        groupStyles: Array.isArray(listing.groupStyles) ? [...listing.groupStyles] : [],
        environments: Array.isArray(listing.environments) ? [...listing.environments] : [],
        activityForms: Array.isArray(listing.activityForms) ? [...listing.activityForms] : [],
        seoKeywords: Array.isArray(listing.seoKeywords) ? [...listing.seoKeywords] : [],
        moderationNoteText:
          typeof (listing as any).moderationNoteText === 'string'
            ? ((listing as any).moderationNoteText as string)
            : null,
        moderationNoteAttachments: Array.isArray((listing as any).moderationNoteAttachments)
          ? (listing as any).moderationNoteAttachments.map((item: any) => ({
              name: typeof item?.name === 'string' ? item.name : null,
              data: typeof item?.data === 'string' ? item.data : null,
              url: typeof item?.url === 'string' ? item.url : null,
            }))
          : null,
        user: safeUser,
      };

      return { listing: safeListing, avgRating };
    });

    const compareByRelevance = (
      a: { listing: SafeListing; avgRating: number },
      b: { listing: SafeListing; avgRating: number },
    ) => {
      const puntiDiff = Number(b.listing.punti ?? 0) - Number(a.listing.punti ?? 0);
      if (puntiDiff !== 0) return puntiDiff;

      const platformDiff = Number(b.listing.platformRelevance ?? 0) - Number(a.listing.platformRelevance ?? 0);
      if (platformDiff !== 0) return platformDiff;

      const bookingDiff = Number(b.listing.user?.allTimeBookingCount ?? 0) - Number(a.listing.user?.allTimeBookingCount ?? 0);
      if (bookingDiff !== 0) return bookingDiff;

      const likeDiff = Number(b.listing.likesCount ?? 0) - Number(a.listing.likesCount ?? 0);
      if (likeDiff !== 0) return likeDiff;

      const ratingDiff = (b.avgRating || 0) - (a.avgRating || 0);
      if (ratingDiff !== 0) return ratingDiff > 0 ? 1 : -1;

      const reviewsDiff = Number(b.listing.reviewsCount ?? 0) - Number(a.listing.reviewsCount ?? 0);
      if (reviewsDiff !== 0) return reviewsDiff;

      return 0;
    };

    if (sort === 'rating') {
      decoratedListings.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sort === 'priceLow') {
      decoratedListings.sort((a, b) => a.listing.price - b.listing.price);
    } else if (sort === 'priceHigh') {
      decoratedListings.sort((a, b) => b.listing.price - a.listing.price);
    } else if (sort === 'random') {
      decoratedListings.sort((a, b) => {
        const priority = compareByRelevance(a, b);
        if (priority !== 0) return priority;
        return Math.random() - 0.5;
      });
    } else {
      // decoratedListings.sort(() => Math.random() - 0.5);
      // decoratedListings.sort(
      //   (a, b) => (Number(b.listing.punti ?? 0) - Number(a.listing.punti ?? 0)) ||
      //     new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime(),
      // );
      decoratedListings.sort(compareByRelevance);
    }

    return decoratedListings.map((entry) => entry.listing);
  } catch (error: any) {
    throw error;
  }
}
