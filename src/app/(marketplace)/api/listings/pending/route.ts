// app/api/listings/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import { Prisma, ListingStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const locationParam = searchParams.get('location')?.trim() || '';
    const categoryParam = searchParams.get('category')?.trim() || '';

    const buildWhere = (
      status: ListingStatus
    ): Prisma.ListingWhereInput => {
      const where: Prisma.ListingWhereInput = { status };
      const andConditions: Prisma.ListingWhereInput[] = [];

      if (locationParam) {
        andConditions.push({
          OR: [
            { locationValue: { contains: locationParam, mode: 'insensitive' } },
            { locationDescription: { contains: locationParam, mode: 'insensitive' } },
          ],
        });
      }

      if (categoryParam) {
        const variations = Array.from(
          new Set([
            categoryParam,
            categoryParam.toLowerCase(),
            categoryParam.toUpperCase(),
            categoryParam.replace(/\s+/g, '_'),
            categoryParam.replace(/\s+/g, '_').toLowerCase(),
            categoryParam.replace(/\s+/g, '_').toUpperCase(),
          ])
        );

        andConditions.push({
          OR: [
            ...variations.map((value) => ({ category: { has: value } })),
            ...variations.map((value) => ({
              primaryCategory: { equals: value, mode: 'insensitive' },
            })),
          ],
        });
      }

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      return where;
    };

    const statuses: ListingStatus[] = ['pending', 'revision', 'awaiting_reapproval'];

    const listingsByStatus = await Promise.all(
      statuses.map((status) =>
        prisma.listing.findMany({
          where: buildWhere(status),
          include: {
            user: true,
          },
        })
      )
    );

    const [pendingListings, revisionListings, reapprovalListings] = listingsByStatus;

    const [pendingWithSlug, revisionWithSlug, reapprovalWithSlug] = await Promise.all([
      Promise.all(pendingListings.map((listing) => ensureListingSlug(listing))),
      Promise.all(revisionListings.map((listing) => ensureListingSlug(listing))),
      Promise.all(reapprovalListings.map((listing) => ensureListingSlug(listing))),
    ]);

    const combinedListings = [...pendingWithSlug, ...revisionWithSlug, ...reapprovalWithSlug];

    const availableLocations = Array.from(
      new Set(
        combinedListings
          .map((listing) => {
            if (typeof listing.locationValue === 'string' && listing.locationValue.trim()) {
              return listing.locationValue.trim();
            }
            const value = (listing as any)?.location?.value;
            if (typeof value === 'string' && value.trim()) {
              return value.trim();
            }
            return null;
          })
          .filter((value): value is string => Boolean(value))
      )
    );

    const availableCategories = Array.from(
      new Set(
        combinedListings
          .flatMap((listing) => {
            const categories: string[] = [];
            if (Array.isArray((listing as any)?.category)) {
              categories.push(
                ...(listing as any).category.filter(
                  (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
                )
              );
            }
            if (typeof (listing as any)?.primaryCategory === 'string') {
              categories.push((listing as any).primaryCategory as string);
            }
            return categories;
          })
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      )
    );

    return NextResponse.json({
      pending: pendingWithSlug,
      revision: revisionWithSlug,
      awaitingReapproval: reapprovalWithSlug,
      availableFilters: {
        locations: availableLocations,
        categories: availableCategories,
      },
    });
  } catch (error) {
    console.error("[FETCH_PENDING_LISTINGS]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}