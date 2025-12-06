import { NextResponse } from 'next/server';

import prisma from '@/app/(marketplace)/libs/prismadb';

export async function GET() {
  try {

    const reservations = await prisma.reservation.findMany({
    where: { status: 'active' },
    select: {
        listing: {
        select: {
            category: true,
            primaryCategory: true,
        },
        },
    },
    });

    type ReservationForUsage = (typeof reservations)[number];

    const usageMap = reservations.reduce<Record<string, number>>(
    (acc, reservation: ReservationForUsage) => {
        const listingCategories = reservation.listing?.category ?? [];
        const primaryCategory = reservation.listing?.primaryCategory;

        const entries = new Set<string>();

        if (Array.isArray(listingCategories)) {
        listingCategories
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .forEach((value) => entries.add(value));
        }

        if (typeof primaryCategory === 'string' && primaryCategory.trim().length > 0) {
        entries.add(primaryCategory.trim());
        }

        entries.forEach((category) => {
        acc[category] = (acc[category] ?? 0) + 1;
        });

        return acc;
    },
    {},
    );

    const data = Object.entries(usageMap)
      .map(([category, bookingCount]) => ({ category, bookingCount }))
      .sort((a, b) => {
        const diff = b.bookingCount - a.bookingCount;
        if (diff !== 0) return diff;
        return a.category.localeCompare(b.category);
      });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[CATEGORY_USAGE_API]', error);
    return NextResponse.json({ error: 'Failed to fetch category usage' }, { status: 500 });
  }
}
